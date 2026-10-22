import { useSyncExternalStore } from 'react';
import type { EngineLayer, EngineSettings } from '../pattern-engine/prototype-engine.js';
import { formatOf, LAYOUT_SIZES } from '../resources/formats';

// Document du Layout editor : un seul frame (format, fond, rognage) et ses calques, du dessous
// vers le dessus. Repris du « Design libre » du prototype (ligne 3604), simplifié à un frame.
// Gardé dans ce navigateur ; il ne charge pas le moteur (le panneau l'importe seul).

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
    /** Aperçu dessiné par le moteur (élément de la page, jamais enregistré). */
    _cv?: HTMLCanvasElement;
    _acc?: number;
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

const KEY = 'bhc.layout.v1';
const newId = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const emptyDoc = (): LayoutDoc => ({
  name: 'Frame 1',
  w: LAYOUT_SIZES['9:16'][0],
  h: LAYOUT_SIZES['9:16'][1],
  fill: 'lin',
  clip: true,
  layers: [],
});

/** Document en texte : sans l'état interne du moteur ni les éléments de la page. */
export const serialize = (doc: LayoutDoc) =>
  JSON.stringify(doc, (key, value) =>
    key.startsWith('_') || key === 'eng' || key === 'dirty' ? undefined : (value as unknown),
  );

function load(): LayoutDoc | null {
  try {
    const text = localStorage.getItem(KEY);
    const doc = text ? (JSON.parse(text) as LayoutDoc) : null;
    return doc && Array.isArray(doc.layers) ? doc : null;
  } catch {
    return null;
  }
}

// ---------- état partagé (scène et panneau) ----------
// Les calques de motif sont modifiés en place par le moteur : on garde les mêmes objets et on
// prévient les vues avec un numéro de version.
let doc: LayoutDoc = load() ?? emptyDoc();
let selected: string | null = null;
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let beforeSave: (() => void) | null = null;
const listeners = new Set<() => void>();

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    beforeSave?.();
    try {
      localStorage.setItem(KEY, serialize(doc));
    } catch {
      // navigateur plein (images lourdes) : le layout reste affiché, il n'est simplement pas gardé
    }
  }, 400);
}

function emit(persist = true) {
  version++;
  listeners.forEach((listener) => listener());
  if (persist) save();
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
  /** Appelé avant chaque enregistrement (réglages du motif en cours d'édition). */
  onBeforeSave(fn: (() => void) | null) {
    beforeSave = fn;
  },
  select(id: string | null) {
    selected = id && doc.layers.some((layer) => layer.id === id) ? id : null;
    emit(false);
  },
  /** Le document a changé ailleurs (réglages du motif) : enregistrer et redessiner. */
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
  /** Options d'un calque de motif : animé ou fixe, image de l'illustration. */
  updatePattern(id: string, patch: Partial<Pick<PatternLayer, 'anim' | 'imgIndex'>>) {
    const layer = layoutStore.layer(id);
    if (layer?.type !== 'pattern') return;
    Object.assign(layer, patch, { dirty: true });
    emit();
  },
  addLayer(layer: Layer) {
    doc.layers.push(layer);
    selected = layer.id;
    emit();
  },
  removeLayer(id: string) {
    doc.layers = doc.layers.filter((layer) => layer.id !== id);
    if (selected === id) selected = null;
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
    emit(false);
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
  return { doc, selected, layer: layoutStore.layer(selected) };
}
