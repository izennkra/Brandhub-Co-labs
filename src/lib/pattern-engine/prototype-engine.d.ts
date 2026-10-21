// Types du module généré prototype-engine.js (écrits à la main : le module, lui, ne se modifie pas).
import type * as ThreeModule from 'three';

export type EngineSettings = Record<string, unknown>;

export type EngineEnv = {
  THREE: typeof ThreeModule;
  toast: (message: string) => void;
  syncers: Array<() => void>;
  onLibraryChanged: () => void;
  recState: unknown;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  // Design libre : sans effet tant que le moteur n'est pas en mode « libre ».
  DL: undefined;
  dlApplyView: undefined;
  libreTick: undefined;
};

export type PrototypeEngine = {
  readonly S: EngineSettings;
  readonly canvas: HTMLCanvasElement;
  readonly renderer: ThreeModule.WebGLRenderer;
  readonly regenerate: () => void;
  readonly refreshColors: () => void;
  readonly resetView: () => void;
  readonly resize: () => void;
  readonly frame: FrameRequestCallback;
  readonly MEMBRANE_BASE: EngineSettings;
  readonly mulberry32: (seed: number) => () => number;
  readonly loadLibrary: () => Promise<void>;
  readonly isLine: () => boolean;
  readonly buildLine: (keep: boolean) => void;
  rng: () => number;
  lineLobes: unknown[];
};

export function runPrototypeEngine(env: EngineEnv): PrototypeEngine;
