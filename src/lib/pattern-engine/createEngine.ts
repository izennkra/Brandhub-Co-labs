// Couche d'adaptation du moteur de patterns (voir SPEC-pattern-engine.md).
// Le moteur lui-même (prototype-engine.js) est une copie exacte du prototype : rien ici ne le modifie.
// Cette couche lui fournit ce que le reste du prototype lui donnait, puis expose une API à l'appli.
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import * as THREE from 'three';
import type { ControlEffect } from './controls';
import { runPrototypeEngine, type EngineEnv, type PrototypeEngine } from './prototype-engine.js';

// Messages du moteur (toast), réglages modifiés (settings), bibliothèque d'images (library).
export const engineEvents = new EventTarget();

// La boucle du moteur se relance à chaque image via requestAnimationFrame : on la retient quand
// la scène n'est pas affichée (pages Ressource), et on la relance quand elle réapparaît.
export function createAnimationGate(schedule: (callback: FrameRequestCallback) => number) {
  let active = false;
  let pending: FrameRequestCallback | null = null;
  return {
    requestAnimationFrame(callback: FrameRequestCallback) {
      if (active) return schedule(callback);
      pending = callback;
      return 0;
    },
    setActive(value: boolean) {
      active = value;
      if (active && pending) {
        const callback = pending;
        pending = null;
        schedule(callback);
      }
    },
  };
}

type AnimationGate = ReturnType<typeof createAnimationGate>;

export function buildEnv(gate: AnimationGate): EngineEnv {
  const syncers: Array<() => void> = [];
  return {
    THREE,
    toast: (message) => engineEvents.dispatchEvent(new CustomEvent('toast', { detail: message })),
    syncers,
    onLibraryChanged: () => engineEvents.dispatchEvent(new Event('library')),
    recState: null,
    requestAnimationFrame: gate.requestAnimationFrame,
    DL: undefined,
    dlApplyView: undefined,
    libreTick: undefined,
  };
}

// Éléments de page que le moteur cherche au démarrage (mêmes identifiants que dans le prototype).
function createEngineElements() {
  const parking = document.createElement('div');
  parking.hidden = true;
  parking.dataset.engine = 'parking';

  const canvas = document.createElement('canvas');
  canvas.id = 'scene';
  canvas.setAttribute('aria-label', 'Motif génératif en 3D');

  // Étiquettes de l'infographie : même style en ligne que dans le prototype.
  const labels = document.createElement('div');
  labels.id = 'labels';
  labels.setAttribute('aria-hidden', 'true');
  labels.setAttribute('style', 'position:fixed;inset:0;pointer-events:none;overflow:hidden');
  labels.hidden = true;

  // Le moteur écoute ces deux éléments de l'ancienne interface : on les fournit, invisibles.
  const panel = document.createElement('div');
  panel.id = 'panel';
  const openPanel = document.createElement('button');
  openPanel.id = 'openPanel';
  openPanel.tabIndex = -1;

  parking.append(canvas, panel, openPanel);
  document.body.append(parking, labels);
  return { parking, canvas, labels };
}

// Le moteur dessine ses textes avec la famille « Geist » (nom du prototype) : on la déclare,
// à partir des mêmes fichiers que la police de l'appli.
function registerGeistFamily() {
  const face = new FontFace('Geist', `url(${geistLatinUrl}) format('woff2')`, { weight: '100 900' });
  document.fonts.add(face);
  return face.load().catch(() => undefined);
}

// Préréglages de structure, recopiés de l'interface du prototype (STRUCT_PRESETS, ligne 2948) :
// 1 = Membrane (MEMBRANE_BASE, défini dans le moteur), 2 = Ligne.
const LINE_PRESET = {
  fill: 0,
  fusion: 0.9,
  tubeR: 2.2,
  qCount: 40000,
  swirl: 0.12,
  twinkle: 0.1,
  jitter: 0.06,
  pinches: 0,
  bulge: 0,
  relief: 1.0,
  fov: 35,
  depthThin: 0,
  autoRotate: false,
  lobes: 4,
};

export type Structure = 1 | 2; // Membrane, Ligne
export type AppMode = 'motif' | 'image'; // Motif, Illustration (valeurs de S.app dans le prototype)
export type Shape = 0 | 1 | 2 | 3; // Nœud, Ample, Simple, Hasard

// Actions de l'interface du prototype, reprises à l'identique pour la partie moteur
// (la mise à jour des boutons du prototype, elle, est remplacée par le panneau Éditeur).
function createActions(core: PrototypeEngine, syncAll: () => void, toast: (message: string) => void) {
  const newSeed = () => {
    core.rng = core.mulberry32((Math.random() * 1e9) | 0);
  };
  let regenTimer: ReturnType<typeof setTimeout> | undefined;
  const actions = {
    // Bouton « Membrane / Ligne » (prototype ligne 2954).
    setStructure(structure: Structure) {
      core.S.qStruct = structure;
      Object.assign(core.S, structure === 1 ? core.MEMBRANE_BASE : LINE_PRESET);
      syncAll();
      core.regenerate();
      core.resetView();
    },
    // Boutons « Nœud / Ample / Simple / Hasard » (prototype ligne 2923).
    setShape(shape: Shape) {
      core.S.shapeMode = shape;
      newSeed();
      core.regenerate();
      core.resetView();
    },
    // Boutons « Aléatoire / Données / Process » (prototype ligne 2968).
    setLineMode(mode: number) {
      core.S.lineMode = mode;
      core.lineLobes = [];
    },
    // Passage Motif ↔ Illustration (setApp, prototype ligne 3116) : chaque mode garde ses réglages.
    setApp(mode: AppMode) {
      const S = core.S;
      if (S.app === mode) return;
      const pick = (o: Record<string, unknown>) => {
        const r: Record<string, unknown> = {};
        core.IMG_KEYS.forEach((k) => (r[k] = o[k] instanceof Set ? new Set(o[k]) : o[k]));
        return r;
      };
      if (mode === 'image') {
        core.motifStash = Object.assign(pick(S), { _wr: core.worldR });
        S.app = 'image';
        Object.assign(S, core.imageStash || core.IMAGE_DEFAULTS);
        core.imgTime = 0;
        core.imgDirty = true;
      } else {
        core.imageStash = pick(S);
        S.app = 'motif';
        const stash = core.motifStash;
        if (stash) {
          core.worldR = stash._wr || core.worldR;
          delete stash._wr;
          Object.assign(S, stash);
        } else {
          Object.assign(S, pick(core.MEMBRANE_BASE));
          core.regenerate();
        }
      }
      if (S.dots instanceof Set) S.dots = new Set(S.dots);
      syncAll();
      core.refreshColors();
      core.resetView();
      // syncApp (ligne 3132) : images de démo si la bibliothèque est vide.
      if (mode === 'image' && !core.imgList.length) core.imgList = core.demoImages();
    },
    // Pastilles carrées « Fond » (prototype ligne 3530).
    setBackground(id: string) {
      core.S.bg = id;
      core.refreshColors();
      syncAll();
    },
    // Pastilles rondes « Pastilles » : au moins une couleur reste choisie (prototype ligne 3536).
    toggleDot(id: string) {
      const dots = core.S.dots as Set<string>;
      if (dots.has(id)) {
        if (dots.size === 1) return toast('Garde au moins une couleur de pastilles.');
        dots.delete(id);
      } else dots.add(id);
      core.refreshColors();
      syncAll();
    },
    /** Change un réglage de la table controls.ts, puis fait ce que faisait le prototype après ce changement. */
    change(key: string, value: number | boolean, effect?: ControlEffect) {
      if (effect === 'setStructure') return actions.setStructure(value as Structure);
      if (effect === 'setShape') actions.setShape(value as Shape);
      else if (effect === 'setLineMode') actions.setLineMode(value as number);
      else core.S[key] = value;
      // regenSoon (ligne 2671) : nouvelle forme 250 ms après le dernier mouvement.
      if (effect === 'regenSoon') {
        clearTimeout(regenTimer);
        regenTimer = setTimeout(core.regenerate, 250);
      }
      // Longueur et ondulation de la ligne (ligne 3057).
      if (effect === 'buildLine' && core.isLine()) core.buildLine(true);
      // toneChanged, dirtyImg, restartLoop : propres à l'Illustration, branchés avec elle (tâche 10).
      syncAll();
    },
  };
  return actions;
}

// Points d'accroche réservés aux tests navigateur (rendu identique au prototype) : sans effet sinon.
type EngineTestHooks = { beforeStart?: () => void; onReady?: (engine: Engine) => void };
const testHooks = () => (window as Window & { __engineTestHooks?: EngineTestHooks }).__engineTestHooks;

export type Engine = {
  core: PrototypeEngine;
  actions: ReturnType<typeof createActions>;
  canvas: HTMLCanvasElement;
  /** Affiche la scène dans `host` (zone centrale) et relance l'animation. */
  attach: (host: HTMLElement) => void;
  /** Retire la scène et met l'animation en pause. */
  detach: (host: HTMLElement) => void;
};

async function createEngine(): Promise<Engine> {
  const { parking, canvas, labels } = createEngineElements();
  await registerGeistFamily();
  const gate = createAnimationGate((callback) => window.requestAnimationFrame(callback));
  const env = buildEnv(gate);
  testHooks()?.beforeStart?.();
  const core = runPrototypeEngine(env);

  // Démarrage repris de la fin du prototype (lignes 4405-4414), pour la partie moteur et dans le
  // même ordre : refreshColors() ; regenerate() ; resetView() ; loadLibrary() ;
  // requestAnimationFrame(frame). resize() est appelé quand la scène est placée dans la page.
  core.refreshColors();
  core.regenerate();
  core.resetView();
  void core.loadLibrary();
  gate.requestAnimationFrame(core.frame);

  // Chaque mise à jour des réglages (par le moteur ou par le panneau) prévient l'appli.
  env.syncers.push(() => engineEvents.dispatchEvent(new Event('settings')));

  const ready: Engine = {
    core,
    actions: createActions(core, () => env.syncers.forEach((sync) => sync()), env.toast),
    canvas,
    attach(host) {
      host.append(canvas);
      labels.hidden = false;
      core.resize();
      gate.setActive(true);
    },
    detach(host) {
      gate.setActive(false);
      labels.hidden = true;
      if (canvas.parentElement === host) parking.append(canvas);
    },
  };
  testHooks()?.onReady?.(ready);
  return ready;
}

let engine: Promise<Engine> | null = null;

/** Le moteur est unique : créé à la première demande, puis réutilisé. */
export function getEngine(): Promise<Engine> {
  engine ??= createEngine();
  return engine;
}
