// Couche d'adaptation du moteur de patterns (voir SPEC-pattern-engine.md).
// Le moteur lui-même (prototype-engine.js) est une copie exacte du prototype : rien ici ne le modifie.
// Cette couche lui fournit ce que le reste du prototype lui donnait, puis expose une API à l'appli.
import geistLatinUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import * as THREE from 'three';
import { isEditorUnlocked } from '../resources/editor';
import { getStore } from '../store/store';
import type { ControlEffect } from './controls';
import { createExporter } from './exporter';
import { createLayoutBridge, type LayoutTick } from './layout';
import { createLibrary, type Library } from './library';
import { createTitlePainter } from './infoTitles';
import { createModelViews, type ModelViews } from './models';
import { createPresets } from './presets';
import { createShapeSeed, type ShapeSeed } from './shapeSeed';
import {
  runPrototypeEngine,
  type EngineEnv,
  type EngineImage,
  type PrototypeEngine,
} from './prototype-engine.js';

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

// Image suivante du Layout editor : fournie par la scène quand la page est ouverte.
export const libre: { tick: LayoutTick | null } = { tick: null };

// Le moteur annonce chaque image ajoutée comme « enregistrée » : ce n'est plus vrai (library.ts),
// elle ne vit que le temps de la visite tant qu'on ne clique pas sur « Enregistrer l'illustration ».
export function visitToast(message: string) {
  if (message === 'Image ajoutée et enregistrée.')
    return 'Image ajoutée pour cette visite : « Enregistrer l’illustration » la garde pour tous.';
  const many = /^(\d+) images ajoutées et enregistrées\.$/.exec(message);
  if (many) return `${many[1]} images ajoutées pour cette visite : enregistre celles à garder pour tous.`;
  return message;
}

export function buildEnv(gate: AnimationGate): EngineEnv {
  const syncers: Array<() => void> = [];
  return {
    THREE,
    toast: (message) => engineEvents.dispatchEvent(new CustomEvent('toast', { detail: visitToast(message) })),
    syncers,
    onLibraryChanged: () => engineEvents.dispatchEvent(new Event('library')),
    recState: null,
    requestAnimationFrame: gate.requestAnimationFrame,
    DL: { live: null },
    dlApplyView: () => undefined, // la scène du Layout editor se recadre seule (ResizeObserver)
    libreTick: (dt, now) => libre.tick?.(dt, now),
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
// La bibliothèque d'illustrations (library.ts) est créée après les actions : on la lit au moment de l'appel.
function createActions(
  core: PrototypeEngine,
  syncAll: () => void,
  toast: (message: string) => void,
  library: () => Library,
  shapeSeed: ShapeSeed,
) {
  // Chaque nouvelle forme part d'une graine gardée par l'appli (shapeSeed.ts), pour pouvoir la reproduire.
  const newSeed = () => shapeSeed.use();
  let regenTimer: ReturnType<typeof setTimeout> | undefined;
  const actions = {
    // Bouton « Membrane / Ligne » (prototype ligne 2954).
    setStructure(structure: Structure) {
      core.S.qStruct = structure;
      Object.assign(core.S, structure === 1 ? core.MEMBRANE_BASE : LINE_PRESET);
      syncAll();
      newSeed();
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
          newSeed();
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
    // Bouton lecture / pause (btnPlay, ligne 3546).
    togglePause() {
      core.S.paused = !core.S.paused;
      syncAll();
    },
    // Bouton et touche R « Nouvelle forme » ; en Illustration, « Rejouer » (newNetwork, ligne 3547).
    newShape() {
      if (core.S.app === 'image') {
        core.imgTime = 0;
        return;
      }
      newSeed();
      core.linePh = null;
      core.regenerate();
    },
    // ---------- Images de l'Illustration (interface du prototype, lignes 2800 à 2890) ----------
    /** Liste à afficher : nom, vignette, boucle, image choisie, enregistrée pour tous ou non. */
    images() {
      return core.imgList.map((image, index) => ({
        name: image.name,
        thumb: thumbnail(image),
        inLoop: image.inLoop !== false,
        selected: index === core.selImg,
        saved: library().isSaved(index),
      }));
    },
    // loadTone (ligne 2802) : les curseurs de tons montrent ceux de l'image choisie.
    loadTone(index: number) {
      const image = core.imgList[index];
      if (!image) return;
      core.selImg = index;
      image.tone = Object.assign(core.toneFromS(), image.tone || {});
      core.TONE_KEYS.forEach((key) => (core.S[key] = image.tone![key]));
      syncAll();
    },
    // toneChanged (ligne 2809).
    saveTone() {
      const image = core.imgList[core.selImg];
      if (!image) return;
      image.tone = core.toneFromS();
      core.imgDirty = true;
      core.saveImageMeta(image);
    },
    // Bouton « Rétablir les tons » (ligne 2823).
    resetTone() {
      Object.assign(core.S, {
        imgBright: 0,
        imgContr: 10,
        imgGamma: 1,
        imgLow: 8,
        imgHigh: 94,
        imgBlur: 1,
        imgInvert: false,
      });
      syncAll();
      actions.saveTone();
    },
    // pick (ligne 2861) : l'illustration reprend aussi ses propres réglages (library.ts).
    pickImage(index: number) {
      library().pick(index);
    },
    /** Renommer une image (le nom vaut pour la visite, jusqu'à « Enregistrer l'illustration »). */
    renameImage(index: number, name: string) {
      library().rename(index, name);
    },
    /** Bouton « Enregistrer l'illustration » : pour tous, avec tous ses réglages. */
    saveIllustration() {
      return library().save();
    },
    // moveImage (ligne 2836).
    moveImage(from: number, to: number) {
      const list = core.imgList;
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
      const current = list[core.curImg];
      const selected = list[core.selImg];
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      const base = Date.now();
      list.forEach((image, i) => {
        image.t = base + i;
        library().persistMeta(image);
      });
      core.curImg = Math.max(0, list.indexOf(current));
      core.selImg = Math.max(0, list.indexOf(selected));
      core.imgTr = null;
      core.imgDirty = true;
      syncAll();
    },
    // deleteImage (ligne 2845) ; la double confirmation est gérée par le panneau.
    // Pour tous en mode édition, sinon pour cette visite seulement (library.ts).
    async deleteImage(index: number) {
      if (!(await library().remove(index))) return;
      core.imgList.splice(index, 1);
      if (!core.imgList.length) core.imgList = core.demoImages();
      core.curImg = Math.min(core.curImg, core.imgList.length - 1);
      core.selImg = Math.min(core.selImg, core.imgList.length - 1);
      core.imgTr = null;
      core.imgDirty = true;
      actions.loadTone(core.selImg);
    },
    // Coche « Inclure dans la boucle » de la bande d'images (ligne 2876).
    toggleLoop(index: number) {
      const image = core.imgList[index];
      if (!image) return;
      image.inLoop = !(image.inLoop !== false);
      library().persistMeta(image);
      syncAll();
    },
    /** Ajout d'images (fichiers choisis ou déposés) : le moteur les lit, les enregistre et affiche la dernière. */
    addImages(files: FileList | File[]) {
      return core.addImages(files);
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
    /**
     * Textes de l'infographie (procTexts, procLabel, lineData, lineTexts, lineUnit, procSteps), comme les
     * champs du prototype (lignes 2985-3040) ; un nouveau nombre d'étapes refait les renflements.
     */
    setInfo(patch: Record<string, string | number>) {
      if ('procSteps' in patch && patch.procSteps !== core.S.procSteps) core.lineLobes = [];
      Object.assign(core.S, patch);
      syncAll();
    },
    change(key: string, value: number | boolean, effect?: ControlEffect) {
      if (effect === 'setStructure') return actions.setStructure(value as Structure);
      if (effect === 'setShape') actions.setShape(value as Shape);
      else if (effect === 'setLineMode') actions.setLineMode(value as number);
      else core.S[key] = value;
      // regenSoon (ligne 2671) : nouvelle forme 250 ms après le dernier mouvement.
      if (effect === 'regenSoon') {
        clearTimeout(regenTimer);
        regenTimer = setTimeout(() => {
          newSeed();
          core.regenerate();
        }, 250);
      }
      // Longueur et ondulation de la ligne (ligne 3057).
      if (effect === 'buildLine' && core.isLine()) core.buildLine(true);
      // Tons de l'image choisie (toneChanged, ligne 2809) et trame (dirtyImg, ligne 2825).
      if (effect === 'toneChanged') actions.saveTone();
      if (effect === 'dirtyImg') core.imgDirty = true;
      // « Boucle entre les images » (ligne 2789).
      if (effect === 'restartLoop') {
        core.imgTime = 0;
        core.imgTr = null;
      }
      syncAll();
    },
  };
  return actions;
}

// Vignette d'une image (renderThumbs, ligne 2869) : 140 px au plus, calculée une fois.
function thumbnail(image: EngineImage) {
  if (!image.thumb) {
    const thumb = document.createElement('canvas');
    const scale = 140 / Math.max(image.canvas.width, image.canvas.height);
    thumb.width = Math.max(1, Math.round(image.canvas.width * scale));
    thumb.height = Math.max(1, Math.round(image.canvas.height * scale));
    thumb.getContext('2d')?.drawImage(image.canvas, 0, 0, thumb.width, thumb.height);
    image.thumb = thumb.toDataURL('image/png');
  }
  return image.thumb;
}

// Points d'accroche réservés aux tests navigateur (rendu identique au prototype) : sans effet sinon.
// noModels : sans les modèles 3D (ajoutés à l'outil), pour comparer l'Illustration au prototype.
type EngineTestHooks = { beforeStart?: () => void; onReady?: (engine: Engine) => void; noModels?: boolean };
const testHooks = () => (window as Window & { __engineTestHooks?: EngineTestHooks }).__engineTestHooks;

export type Engine = {
  core: PrototypeEngine;
  actions: ReturnType<typeof createActions>;
  /** Préréglages partagés (section du panneau). */
  presets: ReturnType<typeof createPresets>;
  /** Illustrations enregistrées pour tous, et changements de la visite. */
  library: Library;
  /** Export du motif : image, SVG, vidéo, Figma (bloc Export du panneau). */
  exporter: ReturnType<typeof createExporter>;
  canvas: HTMLCanvasElement;
  /** Layout editor : calques de motif dans un frame, export du frame. */
  layout: ReturnType<typeof createLayoutBridge>;
  /** Événements du moteur : toast (message), settings (réglages), library (images), presets. */
  events: EventTarget;
  /** Affiche la scène dans `host` (zone centrale) et relance l'animation. */
  attach: (host: HTMLElement) => void;
  /** Retire la scène et met l'animation en pause. */
  detach: (host: HTMLElement) => void;
};

async function createEngine(): Promise<Engine> {
  const { parking, canvas, labels } = createEngineElements();
  await registerGeistFamily();
  // Avant chaque image du moteur : une illustration 3D reprend la rotation demandée (models.ts).
  let models: ModelViews | null = null;
  // Après chaque image du moteur : on prévient ceux qui l'attendaient (export de toutes les illustrations).
  let waiters: (() => void)[] = [];
  // Titres libres des étapes : l'infographie est réécrite après chaque image du moteur (infoTitles.ts).
  let paintTitles: (() => void) | null = null;
  const gate = createAnimationGate((callback) =>
    window.requestAnimationFrame((now) => {
      models?.tick(now);
      callback(now);
      paintTitles?.();
      const done = waiters;
      waiters = [];
      done.forEach((resolve) => resolve());
    }),
  );
  /** Attend que le moteur ait dessiné `count` images. */
  const afterFrames = async (count: number) => {
    for (let k = 0; k < count; k++) await new Promise<void>((resolve) => waiters.push(resolve));
  };
  const env = buildEnv(gate);
  testHooks()?.beforeStart?.();
  const core = runPrototypeEngine(env);
  paintTitles = createTitlePainter(core, labels);
  // Effet au survol désactivé à l'ouverture (choix du porteur) ; il s'active dans le panneau.
  core.S.hoverOn = false;

  // Démarrage repris de la fin du prototype (lignes 4405-4414), pour la partie moteur et dans le
  // même ordre : refreshColors() ; regenerate() ; resetView() ; loadLibrary() ;
  // requestAnimationFrame(frame). resize() est appelé quand la scène est placée dans la page.
  // loadLibrary() passe par la bibliothèque (library.load), créée juste avant, sans attente entre les deux.
  // La première forme part, elle aussi, d'une graine connue (shapeSeed.ts).
  const shapeSeed = createShapeSeed(core);
  core.refreshColors();
  shapeSeed.use();
  core.regenerate();
  core.resetView();

  // Chaque mise à jour des réglages (par le moteur ou par le panneau) prévient l'appli.
  env.syncers.push(() => engineEvents.dispatchEvent(new Event('settings')));

  const syncAll = () => env.syncers.forEach((sync) => sync());
  const store = getStore();
  const actions = createActions(core, syncAll, env.toast, () => library, shapeSeed);
  const presets = createPresets(
    core,
    actions,
    syncAll,
    env.toast,
    () => engineEvents.dispatchEvent(new Event('presets')),
    { store, isEditor: isEditorUnlocked, shapeSeed },
  );
  if (!testHooks()?.noModels) models = createModelViews(core, syncAll);
  const library = createLibrary(core, store, {
    models: models ?? undefined,
    snapshot: presets.snapshot,
    apply: presets.applySnapshot,
    loadTone: actions.loadTone,
    isEditor: isEditorUnlocked,
    toast: env.toast,
    changed: syncAll,
  });
  void library.load();
  gate.requestAnimationFrame(core.frame);

  // Le préréglage de démarrage d'un outil s'applique quand cet outil s'ouvre, après les réglages
  // propres à la première illustration.
  const setApp = actions.setApp;
  actions.setApp = (mode) => {
    setApp(mode);
    library.onAppChanged();
    presets.onAppChanged();
  };
  // onLibraryChanged (ligne 2888) : bibliothèque d'images chargée ou modifiée par le moteur.
  engineEvents.addEventListener('library', () =>
    actions.loadTone(Math.min(core.selImg, core.imgList.length - 1)),
  );

  // Carte graphique saturée : le navigateur coupe le dessin. On le dit, plutôt qu'un écran vide.
  canvas.addEventListener('webglcontextlost', () =>
    env.toast('La carte graphique a été saturée : recharge la page pour retrouver les motifs.'),
  );

  const exporter = createExporter(core, env.toast, syncAll, (index) => library.pick(index), afterFrames);
  const layout = createLayoutBridge(core, env.DL, libre, gate, env.toast, syncAll);

  // initPresets() : appelé au démarrage, comme à la fin du prototype (ligne 4411).
  void presets.init();

  const ready: Engine = {
    core,
    actions,
    presets,
    library,
    exporter,
    layout,
    canvas,
    events: engineEvents,
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
