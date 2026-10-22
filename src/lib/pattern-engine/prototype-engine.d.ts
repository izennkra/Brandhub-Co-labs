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

// Image de l'Illustration (bibliothèque du moteur).
export type EngineImage = {
  name: string;
  canvas: HTMLCanvasElement;
  id?: string;
  t?: number;
  inLoop?: boolean;
  tone?: EngineSettings;
  thumb?: string;
};

// Infographie (étiquettes du mode Données / Process), lue par l'export SVG et Figma.
export type EngineInfoItem = {
  on: boolean;
  n: number;
  x: number;
  y: number;
  text: string;
  topText: string;
  top: { fs: number; fw: number; padX: number; h: number };
  bot: { kind: 'card' | 'text'; w: number; padX: number; padY: number; fs: number; fw: number; lh: number };
};
export type EngineInfo = {
  items: EngineInfoItem[];
  sc: number;
  top: number;
  bot: number;
  kind: string;
  col: unknown;
};
export type EngineInfoGeom = { dTop: number; dBot: number; cardY: number; base: (line: number) => number };
// Enregistrement vidéo : lu par la boucle du moteur à chaque image.
export type EngineRecState = {
  t: number;
  dur: number;
  done: (() => void) | null;
  build: boolean;
  tail: number;
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
  readonly PALETTE: ReadonlyArray<{ id: string; name: string; hex: string }>;
  readonly IMG_KEYS: readonly string[];
  readonly IMAGE_DEFAULTS: EngineSettings;
  readonly demoImages: () => EngineImage[];
  readonly addImages: (files: FileList | File[]) => Promise<void>;
  readonly showImage: (index: number) => void;
  readonly saveImageMeta: (image: EngineImage) => void;
  // Stockage du moteur : service partagé /api/store s'il répond, sinon ce navigateur.
  readonly Store: {
    readonly kind: 'claude' | 'api' | 'local';
    readonly readOnly: boolean;
    list: (collection: string) => Promise<Array<{ id: string; data: EngineSettings }>>;
    put: (collection: string, id: string, data: unknown) => Promise<void>;
    del: (collection: string, id: string) => Promise<void>;
  };
  readonly storeReady: Promise<void>;
  readonly orbit: { theta: number; phi: number; radius: number; target: ThreeModule.Vector3 };
  // Export (dock d'export du prototype, lignes 3211-3440)
  readonly VW: number;
  readonly VH: number;
  readonly camera: ThreeModule.PerspectiveCamera;
  readonly panelShift: (width: number) => number;
  readonly pillMat: ThreeModule.ShaderMaterial;
  readonly pillScene: ThreeModule.Scene;
  readonly quadMat: ThreeModule.ShaderMaterial;
  readonly quadScene: ThreeModule.Scene;
  readonly quadCam: ThreeModule.Camera;
  readonly rt: ThreeModule.WebGLRenderTarget;
  readonly lastInfo: EngineInfo | null;
  readonly drawInfoCanvas: (ctx: CanvasRenderingContext2D, info: EngineInfo, k: number) => void;
  readonly infoSVG: (info: EngineInfo, k?: number) => string;
  readonly infoGeom: (info: EngineInfo, item: EngineInfoItem) => EngineInfoGeom;
  readonly bgCol: [number, number, number];
  readonly lastFog: { near: number; far: number };
  readonly LSTEP: number;
  readonly lastN: number;
  readonly sPos: Float32Array;
  readonly sSeed: Float32Array;
  readonly sCol: Float32Array;
  readonly dPos: Float32Array;
  readonly dSeed: Float32Array;
  readonly dSize: Float32Array;
  readonly dCol: Float32Array;
  readonly HEX: Record<string, string>;
  readonly imgSets: unknown[];
  readonly buildImageSets: () => void;
  readonly imgLoopDur: () => number;
  readonly loopList: () => unknown[];
  recState: EngineRecState | null;
  recording: boolean;
  drawP: number;
  lobes: unknown[];
  syn: unknown[];
  synAcc: number;
  spawnAcc: number;
  links: unknown[];
  readonly TONE_KEYS: readonly string[];
  readonly toneFromS: () => EngineSettings;
  curImg: number;
  selImg: number;
  imgTr: unknown;
  linePh: unknown;
  motifStash: (EngineSettings & { _wr?: number }) | null;
  imageStash: EngineSettings | null;
  worldR: number;
  imgList: EngineImage[];
  rng: () => number;
  lineLobes: unknown[];
  imgTime: number;
  imgDirty: boolean;
};

export function runPrototypeEngine(env: EngineEnv): PrototypeEngine;
