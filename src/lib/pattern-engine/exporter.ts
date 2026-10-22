// Export du motif : image, SVG, vidéo, Figma. Recopié de l'interface du prototype
// (reference/prototype.html, lignes 3211 à 3517), ligne d'origine en commentaire.
// Le moteur n'est pas modifié : on lit ses éléments (scène, caméra, pastilles) comme le faisait le prototype.
import * as THREE from 'three';
import { EXPORT_FMTS, EXPORT_SCALES } from './export-options';
import type { EngineRecState, PrototypeEngine } from './prototype-engine.js';

// stamp (ligne 3330).
export function stamp(d = new Date()) {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// saveFile (ligne 3309) : téléchargement par le navigateur (le prototype passait aussi par Claude).
export async function saveFile(filename: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
}

// copyText (ligne 3425).
export async function copyText(t: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {
    // on essaie l'ancienne méthode
  }
  const ta = document.createElement('textarea');
  ta.value = t;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

// pickVideoMime (ligne 3442) : MP4 si le navigateur le permet, sinon WebM.
export function pickVideoMime() {
  if (!window.MediaRecorder) return null;
  const types = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1.4D401F',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return (
    types.find((t) => {
      try {
        return MediaRecorder.isTypeSupported(t);
      } catch {
        return false;
      }
    }) || null
  );
}

// downscale (ligne 3217) : réduction par moitiés successives, pour des bords doux.
function downscale(src: HTMLCanvasElement, W: number, H: number) {
  let c = src;
  while (c.width / 2 >= W * 1.0 && c.height / 2 >= H * 1.0) {
    const t = document.createElement('canvas');
    t.width = Math.round(c.width / 2);
    t.height = Math.round(c.height / 2);
    const x = t.getContext('2d')!;
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, t.width, t.height);
    c = t;
  }
  return c;
}

// Le Motif s'exporte toujours en 16:9, quel que soit le format de l'écran (choix du porteur).
export const MOTIF_RATIO = 16 / 9;

/**
 * Cadre d'export du Motif : 16:9 à la hauteur de la scène, centré sur elle. Le motif garde sa taille ;
 * ce qui dépasse de l'écran sur les côtés (scène plus étroite que 16:9) se retrouve dans l'export.
 */
export function motifFrame(width: number, height: number) {
  const w = Math.round(height * MOTIF_RATIO);
  return { width: w, height, left: Math.round((width - w) / 2) };
}

// Prochaine image du moteur (100 ms au plus : un onglet caché n'en dessine pas).
const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve);
    setTimeout(resolve, 100);
  });

export function createExporter(core: PrototypeEngine, toast: (message: string) => void, syncAll: () => void) {
  const S = core.S;

  // Pendant un export du Motif, la scène passe en 16:9 (motifFrame) : le moteur la mesure à cette
  // taille (resize), l'écran n'en montre que la partie visible, sans changer d'échelle.
  async function inMotifFrame(fn: () => Promise<unknown>) {
    const canvas = core.canvas as HTMLCanvasElement;
    const host = canvas.parentElement;
    if (S.app !== 'motif' || !host) return fn();
    const frame = motifFrame(host.clientWidth, host.clientHeight);
    const before = canvas.style.cssText;
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: `${frame.left}px`,
      width: `${frame.width}px`,
      height: `${frame.height}px`,
      maxWidth: 'none',
    });
    core.resize();
    // une image du moteur à la nouvelle taille (infographie replacée)
    await nextFrame();
    await nextFrame();
    try {
      return await fn();
    } finally {
      canvas.style.cssText = before;
      core.resize();
    }
  }

  // exportPNG (ligne 3332) : rendu de la scène à k fois sa taille, fond transparent.
  async function exportPNG(
    k: number,
    withInfo: boolean,
    asCanvas: true,
  ): Promise<HTMLCanvasElement | undefined>;
  async function exportPNG(
    k: number,
    withInfo?: boolean,
    asCanvas?: boolean,
  ): Promise<HTMLCanvasElement | void>;
  async function exportPNG(k: number, withInfo?: boolean, asCanvas?: boolean) {
    const { renderer, camera, pillMat, quadMat } = core;
    const w = core.VW,
      h = core.VH,
      W = Math.round(w * k),
      H = Math.round(h * k);
    const maxT = renderer.capabilities.maxTextureSize;
    if (W > maxT || H > maxT) {
      toast('×' + k + ' dépasse la taille maximale de ta carte graphique (' + maxT + ' px).');
      return;
    }
    toast('Rendu en cours…');
    await new Promise((r) => setTimeout(r, 30));
    const rtA = new THREE.WebGLRenderTarget(W, H, {
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    const rtB = new THREE.WebGLRenderTarget(W, H, { depthBuffer: false, stencilBuffer: false });
    const shift = core.panelShift(w);
    camera.aspect = (w + shift) / h;
    if (shift) camera.setViewOffset((w + shift) * k, H, shift * k, 0, W, H);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const U = pillMat.uniforms,
      old = { scale: U.uScale.value, pr: U.uPR.value };
    U.uScale.value = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    U.uPR.value = k;
    try {
      renderer.setRenderTarget(rtA);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(core.pillScene, camera);
      quadMat.uniforms.tMap.value = rtA.texture;
      quadMat.blending = THREE.NoBlending;
      renderer.setRenderTarget(rtB);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(core.quadScene, core.quadCam);
      const buf = new Uint8Array(W * H * 4);
      renderer.readRenderTargetPixels(rtB, 0, 0, W, H, buf);
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d')!,
        img = ctx.createImageData(W, H),
        row = W * 4;
      for (let y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * row, (H - y) * row), y * row);
      ctx.putImageData(img, 0, 0);
      if (core.lastInfo && withInfo !== false) core.drawInfoCanvas(ctx, core.lastInfo, k);
      if (asCanvas) return cv;
      const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/png'));
      if (blob) await saveFile(`brand-hub-co-labs-${stamp()}-x${k}.png`, blob);
    } finally {
      quadMat.uniforms.tMap.value = core.rt.texture;
      quadMat.blending = THREE.NormalBlending;
      U.uScale.value = old.scale;
      U.uPR.value = old.pr;
      renderer.setRenderTarget(null);
      rtA.dispose();
      rtB.dispose();
      core.resize();
    }
  }

  // exportImage (ligne 3225) : rendu sur-échantillonné puis réduit, au format choisi.
  async function exportImage() {
    const k = EXPORT_SCALES[Number(S.expSize) | 0] ?? 2;
    const [fl, ext, type] = EXPORT_FMTS[Number(S.expFmt) | 0];
    const W = Math.round(core.VW * k),
      H = Math.round(core.VH * k);
    const maxT = core.renderer.capabilities.maxTextureSize;
    // sur-échantillonnage ×2 quand la carte graphique le permet (bords nets, sans crénelage)
    const ss = Math.max(1, Math.min(2, Math.sqrt(36e6 / (W * H)), maxT / Math.max(W, H)));
    const cv = await exportPNG(k * ss, true, true);
    if (!cv) return;
    const src = downscale(cv, W, H);
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const o = out.getContext('2d')!;
    o.imageSmoothingEnabled = true;
    o.imageSmoothingQuality = 'high';
    if (S.expBg || ext === 'jpg') {
      o.fillStyle = core.HEX[S.bg as string];
      o.fillRect(0, 0, W, H);
    }
    o.drawImage(src, 0, 0, W, H);
    let blob = await new Promise<Blob | null>((r) =>
      out.toBlob(r, type, ext === 'png' ? undefined : ext === 'webp' ? 0.9 : 0.92),
    );
    let realExt: string = ext;
    if (!blob || (ext === 'webp' && blob.type !== 'image/webp')) {
      blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
      realExt = 'png';
      toast('Ce navigateur ne sait pas créer de WebP : export en PNG.');
    }
    if (!blob) throw new Error('image vide');
    await saveFile(`brand-hub-co-labs-${stamp()}-${k}x.${realExt}`, blob);
    if (realExt === ext) toast(`${fl} ${W}×${H} · ${(blob.size / 1048576).toFixed(1)} Mo`);
  }

  // buildSVG (ligne 3369) : chaque pastille devient une forme, de l'arrière vers l'avant.
  function buildSVG(withBg: boolean, patternImg?: string | null, noInfo?: boolean) {
    const { camera, orbit, sPos, sSeed, sCol, dPos, dSeed, dSize, dCol, lastFog } = core;
    const w = core.VW,
      h = core.VH;
    camera.updateMatrixWorld();
    const scale = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const refZ = camera.position.distanceTo(orbit.target);
    const view = camera.matrixWorldInverse,
      proj = camera.projectionMatrix,
      v = new THREE.Vector3();
    const hex = (r: number, g: number, b: number) =>
      '#' +
      [r, g, b]
        .map((x) =>
          Math.round(Math.min(1, Math.max(0, x)) * 255)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');
    const bg = core.bgCol,
      fogK = Number(S.fog);
    const shade = (c: number[], z: number) => {
      if (fogK <= 0.001) return hex(c[0], c[1], c[2]);
      let t = (z - lastFog.near) / (lastFog.far - lastFog.near);
      t = Math.min(1, Math.max(0, t));
      t = t * t * (3 - 2 * t) * fogK;
      return hex(c[0] + (bg[0] - c[0]) * t, c[1] + (bg[1] - c[1]) * t, c[2] + (bg[2] - c[2]) * t);
    };
    const P = (arr: Float32Array, i: number) => {
      v.set(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]).applyMatrix4(view);
      const z = -v.z;
      v.applyMatrix4(proj);
      return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h, z];
    };
    const f1 = (x: number) => Math.round(x * 10) / 10;
    const out = [
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    ];
    if (withBg) out.push(`<rect id="Fond" width="${w}" height="${h}" fill="${core.HEX[S.bg as string]}"/>`);
    const lastN = core.lastN;
    if (patternImg) {
      // motif rendu en image (fond transparent), l'infographie reste vectorielle par-dessus
      out.push(
        `<image id="Motif" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" href="${patternImg}" xlink:href="${patternImg}"/>`,
      );
    } else {
      // fil : tracés continus, dans l'ordre où ils ont été générés
      out.push('<g id="Fil" fill="none" stroke-linecap="round" stroke-linejoin="round">');
      const gap2 = core.LSTEP * 3 * (core.LSTEP * 3);
      let pts: string[] = [],
        col: string | null = null,
        z0 = 0,
        prev = -1;
      const flush = () => {
        if (pts.length > 1) {
          const sw = Number(S.linePx) * Math.min(1.6, Math.max(0.6, refZ / z0));
          out.push(
            `<polyline stroke="${col}" stroke-width="${Math.round(sw * 100) / 100}" points="${pts.join(' ')}"/>`,
          );
        }
        pts = [];
      };
      for (let i = 0; i < lastN; i++) {
        if (sSeed[i] >= 0) {
          continue;
        }
        if (prev >= 0) {
          const dx = sPos[i * 3] - sPos[prev * 3],
            dy = sPos[i * 3 + 1] - sPos[prev * 3 + 1],
            dz = sPos[i * 3 + 2] - sPos[prev * 3 + 2];
          if (dx * dx + dy * dy + dz * dz > gap2) flush();
        }
        const [x, y, z] = P(sPos, i);
        if (!pts.length) {
          z0 = z;
          col = shade([sCol[i * 3], sCol[i * 3 + 1], sCol[i * 3 + 2]], z);
        }
        pts.push(f1(x) + ',' + f1(y));
        prev = i;
      }
      flush();
      out.push('</g>');
      // pastilles : de l'arrière vers l'avant
      out.push('<g id="Pastilles">');
      const maxPx = Number(S.maxPx),
        relief = Number(S.relief),
        depthThin = Number(S.depthThin),
        aspect = Number(S.aspect);
      for (let i = 0; i < lastN; i++) {
        if (dSeed[i] < 0) continue;
        const [x, y, z] = P(dPos, i);
        if (z <= 0) continue;
        let pw =
          ((dSize[i] * scale) / z) *
          Math.pow(Math.min(4, Math.max(0.25, Math.max(refZ, 45) / z)), relief * 1.6);
        pw = maxPx * (1 - Math.exp(-pw / maxPx));
        if (pw < 0.9) continue;
        if (depthThin > 0) {
          let t = (z - lastFog.near) / (lastFog.far - lastFog.near);
          t = Math.min(1, Math.max(0, t));
          t = t * t * (3 - 2 * t);
          if (dSeed[i] < depthThin * t) continue;
        }
        const ar = Math.max(1, aspect * (0.82 + 0.36 * dSeed[i])),
          ph = pw / ar;
        if (x + pw < 0 || x - pw > w || y + ph < 0 || y - ph > h) continue;
        out.push(
          `<rect x="${f1(x - pw / 2)}" y="${f1(y - ph / 2)}" width="${f1(pw)}" height="${f1(ph)}" rx="${f1(ph / 2)}" fill="${shade([dCol[i * 3], dCol[i * 3 + 1], dCol[i * 3 + 2]], z)}"/>`,
        );
      }
      out.push('</g>');
    }
    if (core.lastInfo && !noInfo) out.push(core.infoSVG(core.lastInfo));
    out.push('</svg>');
    return out.join('\n');
  }

  // exportSVG (ligne 3422).
  async function exportSVG() {
    await saveFile(
      `brand-hub-co-labs-${stamp()}.svg`,
      new Blob([buildSVG(false)], { type: 'image/svg+xml' }),
    );
  }

  // figK (ligne 3433) : facteur de rendu le plus élevé possible (×5 visé), selon la carte graphique.
  function figK() {
    const m = core.renderer.capabilities.maxTextureSize,
      w = core.VW,
      h = core.VH;
    return Math.max(2, Math.min(5, Math.floor(m / Math.max(w, h))));
  }

  // recordVideo (ligne 3447).
  async function recordVideo() {
    const mime = pickVideoMime();
    const canvas = core.canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream };
    if (!mime || !canvas.captureStream) {
      toast('L’enregistrement vidéo n’est pas disponible dans ce navigateur.');
      return;
    }
    const isImg = S.app === 'image';
    if (isImg && (core.imgDirty || !core.imgSets.length)) core.buildImageSets();
    const dur = isImg ? core.imgLoopDur() : Number(S.videoDur);
    const wasPaused = S.paused;
    S.paused = false;
    syncAll();
    core.recording = true;
    core.resize();
    if (isImg) core.imgTime = 0; // une boucle complète, du début à la fin
    const build = !isImg && !!S.videoBuild;
    if (build) {
      // la forme repart de zéro
      core.drawP = 0;
      core.lobes = [];
      core.lineLobes = [];
      core.syn = [];
      core.synAcc = 0;
      core.spawnAcc = 0;
      core.links = [];
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const stream = canvas.captureStream(60);
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: Math.round(Math.min(40e6, Math.max(16e6, canvas.width * canvas.height * 8))),
      });
    } catch {
      rec = new MediaRecorder(stream);
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    const stopped = new Promise((r) => {
      rec.onstop = r;
    });
    const state: EngineRecState = { t: 0, dur, done: null, build, tail: 0 };
    const finished = new Promise<void>((r) => {
      state.done = r;
    });
    core.recState = state;
    rec.start(500);
    toast(build ? 'Enregistrement de la construction…' : 'Enregistrement… 0 / ' + Math.round(dur) + ' s');
    await finished;
    rec.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    core.recState = null;
    core.recording = false;
    core.resize();
    S.paused = wasPaused;
    syncAll();
    const isMp4 = /mp4/.test(rec.mimeType || mime);
    const blob = new Blob(chunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
    if (!blob.size) {
      toast('La vidéo est vide : réessaie avec l’onglet au premier plan.');
      return;
    }
    await saveFile(`brand-hub-co-labs-${stamp()}.${isMp4 ? 'mp4' : 'webm'}`, blob);
    if (!isMp4)
      toast('Ce navigateur enregistre en WebM (pas en MP4). Pour un MP4, utilise Chrome récent ou Safari.');
  }

  // copyFigmaPlugin (ligne 3484) : données pour le plugin « Brand Hub Co-labs → Figma ».
  async function copyFigmaPlugin() {
    const w = core.VW,
      h = core.VH;
    let pattern;
    if ((Number(S.figmaMode) | 0) === 1) {
      const cv = await exportPNG(figK(), false, true);
      if (!cv) return;
      pattern = { type: 'png', data: cv.toDataURL('image/png').split(',')[1] };
    } else pattern = { type: 'svg', svg: buildSVG(false, null, true) };
    const I = core.lastInfo,
      items = [];
    if (I)
      for (const it of I.items) {
        if (!it.on) continue;
        const g = core.infoGeom(I, it),
          B = it.bot,
          sc = I.sc,
          r = (v: number) => Math.round(v * 100) / 100;
        items.push({
          n: it.n,
          x: r(it.x),
          stem: { y1: r(g.dTop), y2: r(g.dBot), w: r(sc), dash: [r(0.5 * sc), r(3.2 * sc)] },
          dots: [
            [r(g.dTop), r(2.4 * sc)],
            [r(it.y), r(3 * sc)],
            [r(g.dBot), r(2.4 * sc)],
          ],
          top: {
            name: I.kind === 'process' ? 'Bouton étape' : 'Bouton valeur',
            text: it.topText,
            cy: r(I.top),
            fs: r(it.top.fs),
            fw: it.top.fw,
            padX: r(it.top.padX),
            h: r(it.top.h),
          },
          bot:
            B.kind === 'card'
              ? {
                  kind: 'card',
                  text: it.text,
                  y: r(g.cardY),
                  w: r(B.w),
                  padX: r(B.padX),
                  padY: r(B.padY),
                  fs: r(B.fs),
                  fw: B.fw,
                  lh: r(B.lh),
                  radius: r(3 * sc),
                }
              : {
                  kind: 'text',
                  text: it.text,
                  y: r(g.base(0) - (B.lh * 0.5 + B.fs * 0.36)),
                  w: r(B.w),
                  fs: r(B.fs),
                  fw: B.fw,
                  lh: r(B.lh),
                },
        });
      }
    const data = {
      app: 'synapse-figma',
      v: 1,
      w,
      h,
      bg: core.HEX[S.bg as string],
      pattern,
      kind: I ? I.kind : null,
      colors: I ? I.col : null,
      items,
    };
    const ok = await copyText(JSON.stringify(data));
    if (ok)
      toast(
        'Copié pour le plugin. Dans Figma : Plugins › Développement › Brand Hub Co-labs → Figma, puis colle.',
      );
    else toast('La copie n’a pas été autorisée ici.');
  }

  // copyFigma (ligne 3505).
  async function copyFigma() {
    let img = null;
    if ((Number(S.figmaMode) | 0) === 1) {
      const cv = await exportPNG(figK(), false, true);
      if (!cv) return;
      img = cv.toDataURL('image/png');
    }
    const svg = buildSVG(true, img);
    const ok = await copyText(svg);
    if (ok)
      toast(
        'Copié. Dans Figma, colle avec ⌘V / Ctrl+V : calques « Fond », « Fil », « Pastilles » et « Infographie » (textes éditables).',
      );
    else toast('La copie n’a pas été autorisée ici. Utilise l’export SVG puis glisse le fichier dans Figma.');
  }

  // runDock (ligne 3292) : une seule opération à la fois, erreur affichée en message.
  let busy = false;
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    busy = true;
    syncAll();
    try {
      await inMotifFrame(fn);
    } catch (e) {
      console.error(e);
      toast('L’export a échoué : ' + ((e as Error)?.message || e));
    }
    busy = false;
    syncAll();
  };

  return {
    get busy() {
      return busy;
    },
    /** Bouton « Exporter » : l'action de l'onglet choisi (renderDock, ligne 3258). */
    exportCurrent() {
      const t = Number(S.expTab) | 0;
      return run(t === 0 ? exportImage : t === 1 ? exportSVG : t === 2 ? recordVideo : copyFigma);
    },
    /** Bouton « Plugin » de l'onglet Figma. */
    copyForPlugin: () => run(copyFigmaPlugin),
    buildSVG,
  };
}
