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
    /** Largeur de référence des pastilles : agrandir le calque agrandit tout le motif (jamais flou). */
    ref: number;
    /** Le fond du motif (couleur « Fond » de ses Couleurs) est peint sous le motif. */
    bgOn: boolean;
    /** Boucle de l'illustration : images de la bibliothèque, dans l'ordre choisi. */
    loop: string[];
    /** Aperçu dessiné par le moteur (élément de la page). */
    _cv?: HTMLCanvasElement;
    _acc?: number;
    /** Cadrage 3D d'origine (« Recentrer le motif »). */
    _cam0?: unknown;
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
  name: 'Frame 1',
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
let mode3d = false; // « Manipuler en 3D » : glisser tourne le motif choisi, la molette zoome dedans
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((listener) => listener());
}

const clampPan = (L: PatternLayer) => {
  const z = Math.max(1, L.zoom || 1),
    m = 0.5 - 0.5 / z;
  const [x, y] = L.pan ?? [0, 0];
  L.pan = [Math.max(-m, Math.min(m, x)), Math.max(-m, Math.min(m, y))];
};

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
  updatePattern(
    id: string,
    patch: Partial<Pick<PatternLayer, 'anim' | 'imgIndex' | 'bgOn' | 'loop' | 'zoom'>>,
  ) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    Object.assign(layer, patch, { dirty: true });
    if (patch.zoom !== undefined) clampPan(layer);
    emit();
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
  /** Maj + glisser : recadre dans le motif zoomé (dx, dy en part du calque). */
  panCrop(id: string, dx: number, dy: number) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    const z = Math.max(1, layer.zoom || 1);
    const [x, y] = layer.pan ?? [0, 0];
    layer.pan = [x - dx / z, y - dy / z];
    clampPan(layer);
    layer.dirty = true;
    emit();
  },
  /** Zoom dans le motif autour d'un point (u, v : de -0,5 à 0,5 dans le calque), 100 à 800 %. */
  zoomInto(id: string, u: number, v: number, factor: number) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    const z0 = Math.max(1, layer.zoom || 1),
      z1 = Math.max(1, Math.min(8, z0 * factor));
    const [px, py] = layer.pan ?? [0, 0];
    const fx = px + u / z0,
      fy = py + v / z0;
    layer.zoom = z1;
    layer.pan = [fx - u / z1, fy - v / z1];
    clampPan(layer);
    layer.dirty = true;
    emit();
  },
  /** « Recentrer le motif » : cadrage 3D d'origine, sans zoom. */
  recenter(id: string) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    if (layer._cam0) layer.cam = JSON.parse(JSON.stringify(layer._cam0));
    Object.assign(layer, { zoom: 1, pan: [0, 0], dirty: true });
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
    bgOn: true,
    loop: [],
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
