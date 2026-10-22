// Layout editor côté moteur : le mode « Design libre » du prototype (lignes 3604 à 4365), réduit à
// un frame. Le moteur dessine chaque calque de motif avec son propre état (renderLayerTo, ligne 2608) ;
// on lui prête les réglages du calque choisi (setLive, ligne 3688), puis on rend ceux de l'outil.
import { RADIUS, type LayoutDoc, type PatternLayer, type Shape } from '../layout/doc';
import { EXPORT_FMTS } from './export-options';
import { pickVideoMime, saveFile } from './exporter';
import type { EngineImage, EngineLayer, EngineSettings, PrototypeEngine } from './prototype-engine.js';

/** Partie d'un calque dessinée seule : centre (cx, cy) et taille f, en part du calque. */
export type Win = { cx: number; cy: number; f: number };

// Côté le plus long dessiné d'un coup par la carte graphique : au-delà, elle peut saturer et
// « décrocher » (plus rien ne s'affiche ensuite). Les grands calques sont dessinés par morceaux.
// Réglable par les tests (comparaison d'un export en un morceau et en plusieurs).
export const limits = { tile: 2048 };

// Un morceau (x0, y0, w, h : repère du calque, centre en 0, tourné de a autour de cx, cy) touche-t-il
// le frame (W × H) ?
function tileInFrame(
  x0: number,
  y0: number,
  w: number,
  h: number,
  a: number,
  cx: number,
  cy: number,
  W: number,
  H: number,
) {
  const c = Math.cos(a),
    s = Math.sin(a);
  const xs: number[] = [],
    ys: number[] = [];
  for (const [x, y] of [
    [x0, y0],
    [x0 + w, y0],
    [x0, y0 + h],
    [x0 + w, y0 + h],
  ]) {
    xs.push(cx + x * c - y * s);
    ys.push(cy + x * s + y * c);
  }
  return Math.max(...xs) > 0 && Math.min(...xs) < W && Math.max(...ys) > 0 && Math.min(...ys) < H;
}

/** Échelles de l'export d'un frame (dock du Design libre, ligne 4371). */
export const LAYOUT_SCALES = [1, 2, 3] as const;

type Gate = { setActive: (active: boolean) => void };
export type LayoutTick = (dt: number, now: number) => void;

// Copie sans lien avec l'original ; les ensembles (pastilles) deviennent des tableaux.
const clone = (o: unknown) =>
  JSON.parse(JSON.stringify(o, (_k, v: unknown) => (v instanceof Set ? [...v] : v))) as EngineSettings;

const fileSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'frame';

// imgEl (ligne 4303) : images des calques, chargées une fois.
const images = new Map<string, HTMLImageElement>();
function imageOf(src: string) {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    images.set(src, img);
  }
  return img;
}

export function createLayoutBridge(
  core: PrototypeEngine,
  dl: { live: EngineLayer | null },
  libre: { tick: LayoutTick | null },
  gate: Gate,
  toast: (message: string) => void,
  syncAll: () => void,
) {
  let main: EngineSettings | null = null; // réglages de l'outil, rendus en sortant
  let exporting = false;
  let busy = false;

  // Réglage d'un calque : dans S s'il est en cours d'édition, sinon dans ses propres réglages.
  const settingOf = (L: PatternLayer, key: string) => (L === dl.live ? core.S[key] : L.settings[key]);
  const keyOf = (image: EngineImage, index: number) => image.id ?? `image-${index}`;

  // Bibliothèque vue par un calque d'illustration en boucle : ses images, dans son ordre, toutes
  // dans la boucle. L'outil Illustration garde la sienne.
  function libraryFor(L: PatternLayer): EngineImage[] | null {
    if (L.app !== 'image' || !settingOf(L, 'imgLoop') || L.loop.length < 2) return null;
    const key = L.loop.join('|') + '#' + core.imgList.length;
    if (L._list?.key !== key) {
      const byKey = new Map(core.imgList.map((image, i) => [keyOf(image, i), image]));
      const images = L.loop.flatMap((k) => (byKey.has(k) ? [{ ...byKey.get(k)!, inLoop: true }] : []));
      L._list = { key, images };
      if (L.eng) (L.eng as { imgDirty: boolean }).imgDirty = true; // trames à recalculer
    }
    return L._list.images as EngineImage[];
  }

  // renderLayerTo (ligne 2608), avec deux ajustements le temps du rendu, puis tout est remis :
  // - la largeur du calque devient sa largeur de référence : agrandir le calque agrandit aussi les
  //   pastilles et les traits, le motif grandit d'un bloc et reste net (le moteur règle PXK sur L.w) ;
  // - la bibliothèque d'images devient celle de la boucle du calque.
  function draw(
    L: PatternLayer,
    pw: number,
    ph: number,
    dt: number,
    ctx: CanvasRenderingContext2D,
    ref = L.ref || L.w,
  ) {
    const width = L.w,
      library = core.imgList,
      own = libraryFor(L);
    // rotation 360° en boucle : un tour exact en L.spin secondes
    if (L.spin > 0 && dt > 0 && L.cam) (L.cam as { theta: number }).theta += (dt * 2 * Math.PI) / L.spin;
    L.w = ref;
    if (own) core.imgList = own;
    try {
      core.renderLayerTo(L, L === dl.live, pw, ph, dt, ctx);
    } finally {
      L.w = width;
      core.imgList = library;
    }
  }

  /**
   * Dessine seulement une partie carrée-proportionnelle du calque : la fenêtre (cx, cy : centre ; f :
   * taille, en part du calque). Le moteur la cadre comme son propre zoom (même rendu, en morceaux).
   * Renvoie le coin haut-gauche réellement dessiné (fenêtre gardée dans l'image du moteur).
   */
  function drawWindow(L: PatternLayer, canvas: HTMLCanvasElement, dt: number, win: Win) {
    const ctx = canvas.getContext('2d')!;
    if (win.f >= 1) {
      draw(L, canvas.width, canvas.height, dt, ctx);
      return { x: 0, y: 0 };
    }
    const z = Math.max(1, L.zoom || 1),
      [px, py] = L.pan ?? [0, 0],
      half = win.f / (2 * z);
    // en coordonnées de l'image du moteur (0 à 1), gardée à l'intérieur
    const lo = (p: number) => 0.5 + p - 0.5 / z;
    const vx = Math.min(1 - half, Math.max(half, lo(px) + win.cx / z)),
      vy = Math.min(1 - half, Math.max(half, lo(py) + win.cy / z));
    const zoom0 = L.zoom,
      pan0 = L.pan;
    L.zoom = z / win.f;
    L.pan = [vx - 0.5, vy - 0.5];
    try {
      draw(L, canvas.width, canvas.height, dt, ctx);
    } finally {
      L.zoom = zoom0;
      L.pan = pan0;
    }
    return { x: (vx - half - lo(px)) * z, y: (vy - half - lo(py)) * z };
  }

  // Bords de ce qui est dessiné (pixels assez opaques), en part de l'image ; null si rien.
  function bounds(ctx: CanvasRenderingContext2D, size: number) {
    const { data } = ctx.getImageData(0, 0, size, size);
    let x0 = size,
      y0 = size,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (data[(y * size + x) * 4 + 3] > 12) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return x1 < 0 ? null : { x0: x0 / size, y0: y0 / size, x1: (x1 + 1) / size, y1: (y1 + 1) / size };
  }

  // composeFrame (ligne 4304) : fond, puis chaque calque à sa place, tourné, à l'échelle sc.
  async function compose(
    doc: LayoutDoc,
    sc: number,
    dt: number,
    ctx: CanvasRenderingContext2D,
    fill: boolean,
  ) {
    const tile = document.createElement('canvas');
    const W = Math.round(doc.w * sc),
      H = Math.round(doc.h * sc);
    ctx.clearRect(0, 0, W, H);
    if (fill && doc.fill) {
      ctx.fillStyle = core.HEX[doc.fill];
      ctx.fillRect(0, 0, W, H);
    }
    ctx.save();
    if (doc.clip) {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
    }
    for (const L of doc.layers) {
      if (L.hidden) continue;
      ctx.save();
      ctx.translate((L.x + L.w / 2) * sc, (L.y + L.h / 2) * sc);
      ctx.rotate(((L.r || 0) * Math.PI) / 180);
      const dw = L.w * sc,
        dh = L.h * sc;
      if (L.type === 'image') {
        const img = imageOf(L.src);
        if (!img.complete) await new Promise((r) => ((img.onload = r), (img.onerror = r)));
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      } else {
        // par morceaux : jamais plus de limits.tile pixels de côté à la fois pour la carte graphique ;
        // les morceaux hors du frame rogné sont sautés. Seul le premier fait avancer l'animation.
        const N = Math.max(1, Math.ceil(Math.max(dw, dh) / limits.tile));
        const a = ((L.r || 0) * Math.PI) / 180,
          cx = (L.x + L.w / 2) * sc,
          cy = (L.y + L.h / 2) * sc;
        let step = dt;
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const x0 = -dw / 2 + (i * dw) / N,
              y0 = -dh / 2 + (j * dh) / N;
            if (doc.clip && !tileInFrame(x0, y0, dw / N, dh / N, a, cx, cy, W, H)) continue;
            const pad = N > 1 ? 1 + (2 * 8 * N) / Math.max(dw, dh) : 1; // 8 px de marge autour du morceau
            const f = pad / N;
            tile.width = Math.max(2, Math.round(dw * f));
            tile.height = Math.max(2, Math.round(dh * f));
            const at = drawWindow(L, tile, step, { cx: (i + 0.5) / N, cy: (j + 0.5) / N, f });
            step = 0;
            // la partie exacte du morceau, prise dans l'image dessinée
            const sx = ((i / N - at.x) / f) * tile.width,
              sy = ((j / N - at.y) / f) * tile.height;
            ctx.drawImage(tile, sx, sy, tile.width / (N * f), tile.height / (N * f), x0, y0, dw / N, dh / N);
          }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Pendant un export, l'aperçu s'arrête ; ensuite tous les calques sont redessinés.
  async function run<T>(doc: LayoutDoc, task: () => Promise<T>) {
    if (busy) return null;
    busy = exporting = true;
    syncAll();
    try {
      return await task();
    } catch (error) {
      console.error(error);
      toast('L’export n’a pas abouti. Réessaie avec une taille plus petite.');
      return null;
    } finally {
      busy = exporting = false;
      for (const L of doc.layers) if (L.type === 'pattern') L.dirty = true;
      syncAll();
    }
  }

  async function canvasOf(doc: LayoutDoc, sc: number, transparent: boolean, opaque: boolean) {
    const c = document.createElement('canvas');
    c.width = Math.round(doc.w * sc);
    c.height = Math.round(doc.h * sc);
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    if (opaque && (transparent || !doc.fill)) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, c.width, c.height);
    }
    await compose(doc, sc, 0, ctx, !transparent);
    return c;
  }

  const bridge = {
    get busy() {
      return busy;
    },
    get exporting() {
      return exporting;
    },
    get live() {
      return dl.live;
    },
    get maxTexture() {
      return core.renderer.capabilities.maxTextureSize as number;
    },
    palette: core.PALETTE,
    hex: core.HEX,
    limits,

    /** Entrée dans le Layout editor : le moteur passe en mode « libre » et appelle tick à chaque image. */
    enter(tick: LayoutTick) {
      main ??= core.settingsGet();
      core.S.app = 'libre';
      libre.tick = tick;
      gate.setActive(true);
    },
    /** Sortie : l'outil retrouve ses réglages. */
    leave() {
      bridge.setLive(null);
      libre.tick = null;
      gate.setActive(false);
      if (main) {
        core.settingsSet(main);
        main = null;
        core.refreshColors();
        syncAll();
      }
    },
    /** Calque de motif réglé dans le panneau (ses réglages passent dans S), ou aucun. */
    setLive(L: PatternLayer | null) {
      if (dl.live === L) return;
      if (dl.live) dl.live.settings = core.settingsGet();
      dl.live = L;
      if (L) {
        core.settingsSet(L.settings);
        core.S.app = 'libre';
        core.refreshColors();
      }
      syncAll();
    },
    /** Range les réglages du calque en cours d'édition dans le calque (avant d'enregistrer). */
    syncLive() {
      if (dl.live) dl.live.settings = core.settingsGet();
    },
    /** Réglages d'un nouveau calque : ceux de l'outil (Motif ou Illustration) tels que laissés. */
    baseSettings(app: 'motif' | 'image') {
      const m = main ?? core.settingsGet();
      const own = m.app === app;
      const stash = app === 'image' ? core.imageStash : core.motifStash;
      const fallback =
        app === 'image'
          ? core.IMAGE_DEFAULTS
          : Object.fromEntries(core.IMG_KEYS.map((k) => [k, core.MEMBRANE_BASE[k]]));
      const settings = own ? clone(m) : Object.assign(clone(m), clone(stash ?? fallback));
      delete settings._wr;
      return Object.assign(settings, { app, paused: false });
    },
    render(L: PatternLayer, canvas: HTMLCanvasElement, dt: number, win: Win | null = null) {
      // trame de l'image à recalculer pendant le réglage (libreTick, ligne 3784)
      if (L === dl.live && core.imgDirty && L.eng) {
        (L.eng as { imgDirty: boolean }).imgDirty = true;
        core.imgDirty = false;
      }
      if (win) drawWindow(L, canvas, dt, win);
      else draw(L, canvas.width, canvas.height, dt, canvas.getContext('2d')!);
    },
    /**
     * Mesure la forme d'un calque (rotation automatique et boucle comprises) : elle est dessinée en
     * petit, caméra reculée, puis on relève ses bords. settle : laisse d'abord la forme se construire.
     */
    measure(L: PatternLayer, settle = false): Shape | null {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      if (settle || !L.cam) for (let i = 0; i < 40; i++) draw(L, 48, 48, 0.1, ctx, 48);
      const cam0 = { ...(L.cam as Record<string, number>) },
        zoom0 = L.zoom,
        pan0 = L.pan;
      const eng = L.eng as { imgTime: number } | undefined,
        time0 = eng?.imgTime;
      const turns = settingOf(L, 'autoRotate') || L.spin > 0 ? 8 : 1;
      const images = libraryFor(L)?.length ?? 1;
      const cycle = Number(settingOf(L, 'imgHold')) + Number(settingOf(L, 'imgTrans'));
      let shape: Shape | null = null;
      try {
        // recul de la caméra pour voir toute la forme, dans la limite du moteur (180)
        const kMax = RADIUS[1] / cam0.radius;
        for (let k = Math.min(1.8, kMax); !shape; k = Math.min(k * 2, kMax)) {
          let box: Omit<Shape, 'k' | 'fov'> | null = null;
          for (let image = 0; image < images; image++)
            for (let turn = 0; turn < turns; turn++) {
              L.zoom = 1;
              L.pan = [0, 0];
              L.cam = { ...cam0, radius: cam0.radius * k, theta: cam0.theta + (turn * 2 * Math.PI) / turns };
              draw(L, size, size, image && !turn ? cycle : 0, ctx, size);
              const b = bounds(ctx, size);
              if (b)
                box = box
                  ? {
                      x0: Math.min(box.x0, b.x0),
                      y0: Math.min(box.y0, b.y0),
                      x1: Math.max(box.x1, b.x1),
                      y1: Math.max(box.y1, b.y1),
                    }
                  : b;
            }
          if (!box) break;
          // la forme touche le bord de la vue : on recule davantage (sauf au recul maximal)
          const edge = 1 / size;
          if ((box.x0 > edge && box.y0 > edge && box.x1 < 1 - edge && box.y1 < 1 - edge) || k >= kMax)
            shape = { ...box, k, fov: Number(settingOf(L, 'fov')) || 35 };
        }
      } finally {
        L.cam = cam0;
        L.zoom = zoom0;
        L.pan = pan0;
        if (eng && time0 !== undefined) eng.imgTime = time0;
        L.dirty = true;
      }
      return shape;
    },
    /** Fond du frame : les motifs se fondent dans cette couleur (leur propre fond reste transparent). */
    setBackground(layers: PatternLayer[], id: string) {
      for (const L of layers) {
        if (L === dl.live) core.S.bg = id;
        else L.settings.bg = id;
        L.dirty = true;
      }
      core.refreshColors();
      syncAll();
    },
    /** Boucle entre les illustrations, propre au calque. */
    loopOn(L: PatternLayer) {
      return Boolean(settingOf(L, 'imgLoop'));
    },
    setLoop(L: PatternLayer, on: boolean) {
      if (L === dl.live) core.S.imgLoop = on;
      else L.settings.imgLoop = on;
      if (L.eng) Object.assign(L.eng as object, { imgTime: 0, imgTr: null });
      L.dirty = true;
      syncAll();
    },
    /** Images de la bibliothèque : clé (pour la boucle) et nom. */
    library() {
      return core.imgList.map((image, i) => ({ key: keyOf(image, i), name: image.name }));
    },

    // exportFrameImage (ligne 4324)
    exportImage(doc: LayoutDoc, scale: number, fmt: number, transparent: boolean) {
      const sc = LAYOUT_SCALES[scale] ?? 1;
      const [label, ext, type] = EXPORT_FMTS[fmt] ?? EXPORT_FMTS[0];
      if (Math.max(doc.w, doc.h) * sc > bridge.maxTexture * 1.5) {
        toast('Taille trop grande pour cet appareil : choisis une échelle plus petite.');
        return Promise.resolve(null);
      }
      return run(doc, async () => {
        const c = await canvasOf(doc, sc, transparent, ext === 'jpg');
        let blob = await new Promise<Blob | null>((r) => c.toBlob(r, type, ext === 'png' ? undefined : 0.92));
        let real: string = ext;
        if (!blob || (ext === 'webp' && blob.type !== 'image/webp')) {
          blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
          real = 'png';
        }
        if (!blob) throw new Error('image vide');
        await saveFile(`brand-hub-co-labs-${fileSlug(doc.name)}-${c.width}x${c.height}.${real}`, blob);
        toast(`${label} ${c.width}×${c.height} · ${(blob.size / 1048576).toFixed(1)} Mo`);
      });
    },

    // exportFrameVideo (ligne 4341) : les motifs animés du frame, 1920 px de côté au plus.
    exportVideo(doc: LayoutDoc, seconds: number) {
      const mime = pickVideoMime();
      if (!mime) {
        toast('La vidéo n’est pas disponible dans ce navigateur.');
        return Promise.resolve(null);
      }
      return run(doc, async () => {
        const sc = Math.min(1, 1920 / Math.max(doc.w, doc.h));
        const c = document.createElement('canvas');
        c.width = Math.round((doc.w * sc) / 2) * 2;
        c.height = Math.round((doc.h * sc) / 2) * 2;
        const ctx = c.getContext('2d')!;
        const rec = new MediaRecorder(c.captureStream(30), {
          mimeType: mime,
          videoBitsPerSecond: Math.round(Math.min(40e6, Math.max(12e6, c.width * c.height * 10))),
        });
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const done = new Promise((r) => (rec.onstop = r));
        const fps = 30,
          total = Math.round(seconds * fps);
        rec.start();
        for (let i = 0; i < total; i++) {
          const t0 = performance.now();
          if (doc.fill) {
            ctx.fillStyle = core.HEX[doc.fill];
            ctx.fillRect(0, 0, c.width, c.height);
          }
          await compose(doc, sc, 1 / fps, ctx, true);
          if (i % fps === 0) toast(`Enregistrement… ${Math.round(i / fps)} / ${seconds} s`);
          await new Promise((r) => setTimeout(r, Math.max(0, 1000 / fps - (performance.now() - t0))));
        }
        rec.stop();
        await done;
        const mp4 = mime.startsWith('video/mp4');
        await saveFile(
          `brand-hub-co-labs-${fileSlug(doc.name)}.${mp4 ? 'mp4' : 'webm'}`,
          new Blob(chunks, { type: mp4 ? 'video/mp4' : 'video/webm' }),
        );
      });
    },

    /** Aperçu PNG du frame (Patterns prédéfinis), 1600 px de côté au plus. */
    preview(doc: LayoutDoc) {
      return run(doc, async () => {
        const c = await canvasOf(doc, Math.min(1, 1600 / Math.max(doc.w, doc.h)), false, false);
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
        if (!blob) throw new Error('aperçu vide');
        return blob;
      });
    },
  };
  return bridge;
}

export type LayoutBridge = ReturnType<typeof createLayoutBridge>;
