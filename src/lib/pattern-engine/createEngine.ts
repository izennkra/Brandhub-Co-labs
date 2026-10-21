// Couche d'adaptation du moteur de patterns (voir SPEC-pattern-engine.md).
// Le moteur lui-même (prototype-engine.js) est une copie exacte du prototype : rien ici ne le modifie.
// Cette couche lui fournit ce que le reste du prototype lui donnait, puis expose une API à l'appli.
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import * as THREE from 'three';
import { runPrototypeEngine, type EngineEnv, type PrototypeEngine } from './prototype-engine.js';

// Messages du moteur (toast), demandes de mise à jour des réglages (sync), bibliothèque d'images.
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

export type Engine = {
  core: PrototypeEngine;
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
  const core = runPrototypeEngine(buildEnv(gate));

  // Démarrage repris de la fin du prototype, pour la partie moteur :
  // refreshColors() ; regenerate() ; resetView() ; resize() ; requestAnimationFrame(frame).
  core.refreshColors();
  core.regenerate();
  core.resetView();
  gate.requestAnimationFrame(core.frame);

  return {
    core,
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
}

let engine: Promise<Engine> | null = null;

/** Le moteur est unique : créé à la première demande, puis réutilisé. */
export function getEngine(): Promise<Engine> {
  engine ??= createEngine();
  return engine;
}
