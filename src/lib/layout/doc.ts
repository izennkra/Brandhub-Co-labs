import { useSyncExternalStore } from 'react';
import type { EngineLayer, EngineSettings } from '../pattern-engine/prototype-engine.js';
import { formatOf, LAYOUT_SIZES } from '../resources/formats';

// Document du Layout editor : un seul frame (format, fond, rognage) et ses calques, du dessous
// vers le dessus. Repris du « Design libre » du prototype (ligne 3604), simplifié à un frame.
// Page d'essai : chaque visite part d'un frame vide, rien n'est enregistré (décision du 22/10/2026).
// Ce fichier ne charge pas le moteur (le panneau l'importe seul).

type Box = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  hidden?: boolean;
};
export type PatternLayer = Box &
  EngineLayer & {
    type: 'pattern';
    anim: boolean;
    /** Largeur de référence des traits : agrandir le calque agrandit tout le motif (jamais flou). */
    ref: number;
    /** Recul de la caméra par rapport à celle de l'outil (garde l'épaisseur des traits juste). */
    camScale: number;
    /** Boucle de l'illustration : images de la bibliothèque, dans l'ordre choisi. */
    loop: string[];
    /** Rotation 360° en boucle : durée d'un tour en secondes ; 0 : pas de rotation. */
    spin: number;
    /** Aperçu dessiné par le moteur (élément de la page). */
    _cv?: HTMLCanvasElement;
    _acc?: number;
    /** Partie dessinée dans l'aperçu (calque très zoomé) ; absente : tout le calque. */
    _win?: { cx: number; cy: number; f: number };
    /** Cadrage d'origine, après le premier ajustement (« Recentrer la forme »). */
    _fit0?: { cam: unknown; zoom: number };
    /** Bibliothèque propre à la boucle (calculée par le moteur). */
    _list?: { key: string; images: unknown[] };
  };
export type ImageLayer = Box & { type: 'image'; src: string };
export type Layer = PatternLayer | ImageLayer;
export type LayoutDoc = {
  name: string;
  w: number;
  h: number;
  /** Couleur de fond (identifiant de la palette du moteur) ; null : transparent. */
  fill: string | null;
  /** Rogne les calques qui dépassent du frame. */
  clip: boolean;
  layers: Layer[];
};

const newId = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const emptyDoc = (): LayoutDoc => ({
  name: 'Visuel',
  w: LAYOUT_SIZES['9:16'][0],
  h: LAYOUT_SIZES['9:16'][1],
  fill: 'lin',
  clip: true,
  layers: [],
});

// ---------- état partagé (scène et panneau) ----------
// Les calques de motif sont modifiés en place par le moteur : on garde les mêmes objets et on
// prévient les vues avec un numéro de version.
let doc: LayoutDoc = emptyDoc();
let selected: string | null = null;
let mode3d = false; // mode 3D : glisser tourne la forme choisie, la molette l’agrandit
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((listener) => listener());
}

// ---------- calque ajusté à sa forme ----------
/** Forme mesurée par le moteur : ses bords, en part d'une vue carrée où la caméra a reculé de k. */
export type Shape = { x0: number; y0: number; x1: number; y1: number; k: number; fov: number };
type Cam = { theta: number; phi: number; radius: number; tx: number; ty: number; tz: number };

const TOOL_HEIGHT = 900; // hauteur de la scène de l'outil (px) : les traits gardent leur épaisseur relative
const HEADROOM = 1.5; // recul de la caméra à l'ajout : la forme peut tourner sans sortir de l'image
const MARGIN = 1.03;
/** Distance de caméra permise par le moteur (updateCamera, prototype ligne 1166). */
export const RADIUS = [5, 180] as const;

/**
 * Le calque prend la proportion de sa forme, et la caméra vise le centre de la forme.
 * - cover : à l'ajout, le calque couvre le frame (bord perdu) ;
 * - keep : après une rotation 3D, la forme garde sa taille et sa place, le calque l'épouse.
 * Les unités « vue » valent la hauteur de l'image à la distance de caméra actuelle.
 */
export function fitToShape(
  L: PatternLayer,
  shape: Shape,
  mode: 'cover' | 'keep',
  frame: { w: number; h: number },
) {
  const cam = { ...(L.cam as Cam) };
  const { k } = shape;
  let w = (shape.x1 - shape.x0) * k * MARGIN,
    h = (shape.y1 - shape.y0) * k * MARGIN;
  const cx = ((shape.x0 + shape.x1) / 2 - 0.5) * k,
    cy = ((shape.y0 + shape.y1) / 2 - 0.5) * k;
  const zoom = Math.max(1, L.zoom || 1);
  const pxPerView = L.h * zoom; // pixels du calque par unité de vue (fenêtre centrée sur la forme)

  // la caméra vise le centre de la forme (repère de la caméra : droite, haut)
  const world = 2 * cam.radius * Math.tan((shape.fov * Math.PI) / 360);
  const st = Math.sin(cam.theta),
    ct = Math.cos(cam.theta),
    sp = Math.sin(cam.phi),
    cp = Math.cos(cam.phi);
  const right = [ct, 0, -st],
    up = [-st * cp, sp, -ct * cp];
  cam.tx += (right[0] * cx - up[0] * cy) * world;
  cam.ty += (right[1] * cx - up[1] * cy) * world;
  cam.tz += (right[2] * cx - up[2] * cy) * world;

  // taille à l'écran (mode keep) : avant tout changement de recul
  const keepW = w * pxPerView,
    keepH = h * pxPerView;
  const offset = [cx * pxPerView, cy * pxPerView];

  // recul : de la marge pour tourner à l'ajout, et un zoom entre 1 et 8 ; le moteur garde la
  // caméra entre 5 et 180 de distance
  let back = mode === 'cover' ? HEADROOM : 1;
  if (h / back > 1) back = h;
  if (h / back < 1 / 8) back = h * 8;
  back = Math.min(Math.max(back, RADIUS[0] / cam.radius), RADIUS[1] / cam.radius);
  cam.radius *= back;
  L.camScale = (L.camScale || 1) * back;
  w /= back;
  h /= back;
  const aspect = w / h;
  L.cam = cam;
  L.zoom = Math.min(8, Math.max(1, 1 / h));
  L.pan = [0, 0];

  if (mode === 'cover') {
    const H = Math.max(frame.h, frame.w / aspect);
    Object.assign(L, { w: Math.round(aspect * H), h: Math.round(H), r: 0 });
    Object.assign(L, { x: Math.round((frame.w - L.w) / 2), y: Math.round((frame.h - L.h) / 2) });
    L._fit0 = { cam: { ...cam }, zoom: L.zoom };
  } else {
    const a = (L.r * Math.PI) / 180;
    const ccx = L.x + L.w / 2 + offset[0] * Math.cos(a) - offset[1] * Math.sin(a),
      ccy = L.y + L.h / 2 + offset[0] * Math.sin(a) + offset[1] * Math.cos(a);
    Object.assign(L, { w: Math.round(keepW), h: Math.round(keepH) });
    Object.assign(L, { x: Math.round(ccx - L.w / 2), y: Math.round(ccy - L.h / 2) });
  }
  L.ref = aspect * L.camScale * TOOL_HEIGHT;
  L.dirty = true;
}

const clampRound = (n: number) => Math.round(Number.isFinite(n) ? n : 0);

export const layoutStore = {
  get doc() {
    return doc;
  },
  get selected() {
    return selected;
  },
  layer(id: string | null) {
    return doc.layers.find((layer) => layer.id === id) ?? null;
  },
  get mode3d() {
    return mode3d;
  },
  select(id: string | null) {
    selected = id && doc.layers.some((layer) => layer.id === id) ? id : null;
    if (layoutStore.layer(selected)?.type !== 'pattern') mode3d = false;
    emit();
  },
  set3d(on: boolean) {
    mode3d = on && layoutStore.layer(selected)?.type === 'pattern';
    emit();
  },
  /** Le document a changé ailleurs (réglages du motif) : redessiner. */
  touch() {
    emit();
  },
  setFrame(patch: Partial<Pick<LayoutDoc, 'name' | 'fill' | 'clip'>>) {
    Object.assign(doc, patch);
    emit();
  },
  /** Nouvelle taille du frame : les calques qui le remplissaient le remplissent encore, les autres
   * gardent leur place relative et leurs proportions. */
  resize(w: number, h: number) {
    w = Math.max(16, clampRound(w));
    h = Math.max(16, clampRound(h));
    const sx = w / doc.w,
      sy = h / doc.h,
      k = Math.min(sx, sy);
    for (const layer of doc.layers) {
      const full = layer.x === 0 && layer.y === 0 && layer.w === doc.w && layer.h === doc.h;
      if (full) Object.assign(layer, { w, h });
      else {
        const cx = (layer.x + layer.w / 2) * sx,
          cy = (layer.y + layer.h / 2) * sy;
        const lw = Math.round(layer.w * k),
          lh = Math.round(layer.h * k);
        Object.assign(layer, { w: lw, h: lh, x: Math.round(cx - lw / 2), y: Math.round(cy - lh / 2) });
      }
      if (layer.type === 'pattern') layer.dirty = true;
    }
    Object.assign(doc, { w, h });
    emit();
  },
  setFormat(name: string) {
    const size = LAYOUT_SIZES[name];
    if (size) layoutStore.resize(size[0], size[1]);
  },
  updateLayer(id: string, patch: Partial<Box>) {
    const layer = layoutStore.layer(id);
    if (!layer) return;
    for (const key of ['x', 'y', 'w', 'h', 'r'] as const)
      if (patch[key] !== undefined) patch[key] = clampRound(patch[key]);
    if (patch.w !== undefined) patch.w = Math.max(1, patch.w);
    if (patch.h !== undefined) patch.h = Math.max(1, patch.h);
    Object.assign(layer, patch);
    if (layer.type === 'pattern') layer.dirty = true;
    emit();
  },
  /** Options d'un calque de motif : animé ou fixe, image de l'illustration, fond, boucle. */
  updatePattern(id: string, patch: Partial<Pick<PatternLayer, 'anim' | 'imgIndex' | 'loop' | 'spin'>>) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    Object.assign(layer, patch, { dirty: true });
    emit();
  },
  /** Agrandit ou réduit un calque autour de son centre. */
  scale(id: string, factor: number) {
    const layer = layoutStore.layer(id);
    if (!layer) return;
    const w = Math.max(8, layer.w * factor),
      h = Math.max(8, layer.h * factor);
    layoutStore.updateLayer(id, { w, h, x: layer.x + (layer.w - w) / 2, y: layer.y + (layer.h - h) / 2 });
  },
  // ---------- manipulation 3D (prototype, lignes 3852 à 3940) ----------
  /** Glisser : le motif tourne (caméra du calque). */
  orbit(id: string, dx: number, dy: number) {
    const layer = layoutStore.layer(id);
    const cam = layer?.type === 'pattern' ? (layer.cam as { theta: number; phi: number } | undefined) : null;
    if (!layer || !cam) return;
    cam.theta -= dx * 0.007;
    cam.phi = Math.min(Math.PI - 0.05, Math.max(0.05, cam.phi - dy * 0.007));
    (layer as PatternLayer).dirty = true;
    emit();
  },
  /** « Recentrer la forme » : cadrage 3D d'origine (le calque est ensuite réajusté à la forme). */
  recenter(id: string) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern' || !layer._fit0) return;
    layer.cam = JSON.parse(JSON.stringify(layer._fit0.cam));
    Object.assign(layer, { zoom: layer._fit0.zoom, pan: [0, 0], dirty: true });
    emit();
  },
  /** Le calque épouse sa forme (mesurée par le moteur) : voir fitToShape. */
  fit(id: string, shape: Shape, mode: 'cover' | 'keep') {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern' || !layer.cam) return;
    fitToShape(layer, shape, mode, doc);
    emit();
  },
  addLayer(layer: Layer) {
    doc.layers.push(layer);
    selected = layer.id;
    mode3d = false;
    emit();
  },
  removeLayer(id: string) {
    doc.layers = doc.layers.filter((layer) => layer.id !== id);
    if (selected === id) {
      selected = null;
      mode3d = false;
    }
    emit();
  },
  /** Monte (+1) ou descend (-1) un calque dans la pile. */
  moveLayer(id: string, step: 1 | -1) {
    const i = doc.layers.findIndex((layer) => layer.id === id),
      j = i + step;
    if (i < 0 || j < 0 || j >= doc.layers.length) return;
    [doc.layers[i], doc.layers[j]] = [doc.layers[j], doc.layers[i]];
    emit();
  },
  /** Aligne un calque dans le frame. */
  align(id: string, edge: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    const layer = layoutStore.layer(id);
    if (!layer) return;
    const at: Record<typeof edge, Partial<Box>> = {
      left: { x: 0 },
      center: { x: (doc.w - layer.w) / 2 },
      right: { x: doc.w - layer.w },
      top: { y: 0 },
      middle: { y: (doc.h - layer.h) / 2 },
      bottom: { y: doc.h - layer.h },
    };
    layoutStore.updateLayer(id, at[edge]);
  },
  /** Repart d'un document vide (tests). */
  reset(next: LayoutDoc = emptyDoc()) {
    doc = next;
    selected = null;
    mode3d = false;
    emit();
  },
};

export const formatName = (d: LayoutDoc) => formatOf(d.w, d.h);

const countOf = (kind: string) => doc.layers.filter((l) => l.name.startsWith(kind)).length + 1;

/** Calque de motif (Motif ou Illustration) qui remplit le frame. */
export function newPatternLayer(app: 'motif' | 'image', settings: EngineSettings): PatternLayer {
  const kind = app === 'image' ? 'Illustration' : 'Motif';
  return {
    id: newId(),
    type: 'pattern',
    name: `${kind} ${countOf(kind)}`,
    x: 0,
    y: 0,
    w: doc.w,
    h: doc.h,
    r: 0,
    app,
    settings,
    imgIndex: 0,
    anim: true,
    ref: doc.w,
    camScale: 1,
    loop: [],
    spin: 0,
    zoom: 1,
    pan: [0, 0],
  };
}

/** Calque image, centré, à 60 % du frame au plus. */
export function newImageLayer(name: string, src: string, width: number, height: number): ImageLayer {
  const fit = Math.min((doc.w * 0.6) / width, (doc.h * 0.6) / height, 1);
  const w = Math.round(width * fit),
    h = Math.round(height * fit);
  return {
    id: newId(),
    type: 'image',
    name,
    src,
    x: Math.round((doc.w - w) / 2),
    y: Math.round((doc.h - h) / 2),
    w,
    h,
    r: 0,
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Le document, le calque choisi ; la vue se redessine à chaque changement. */
export function useLayout() {
  useSyncExternalStore(subscribe, () => version);
  return { doc, selected, layer: layoutStore.layer(selected), mode3d };
}
