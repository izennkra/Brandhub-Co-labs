// Illustrations en 3D : un modèle .glb (Prisme, Infini de Möbius) est dessiné sous l'angle voulu et
// cette vue sert d'image à l'Illustration ; la trame de pastilles du moteur s'y applique telle quelle.
// Quand on tourne l'illustration (souris ou rotation automatique), c'est le modèle qui tourne :
// la trame reste face à soi et suit la nouvelle vue. Le moteur n'est pas modifié.
// Aplatie, l'illustration devient une image figée sous son angle (PNG sur fond transparent) :
// elle tourne alors comme les autres illustrations. Repassée en 3D, on peut de nouveau changer l'angle.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import infiniUrl from '../../assets/models/infini.glb?url';
import prismeUrl from '../../assets/models/prisme.glb?url';
import type { EngineImage, PrototypeEngine } from './prototype-engine.js';

export type ModelDef = { id: string; name: string; url: string; yaw: number; pitch: number };

// Modèles proposés à tous (l'identifiant est celui de l'illustration dans la bibliothèque).
export const MODELS: ModelDef[] = [
  { id: 'modele-prisme', name: 'Prisme (modèle 3D)', url: prismeUrl, yaw: 0.5, pitch: 0.25 },
  { id: 'modele-infini', name: 'Infini (modèle 3D)', url: infiniUrl, yaw: 0, pitch: 0.55 },
];

// Taille de la vue dessinée (le moteur la réduit à 700 px pour sa trame).
const SIZE = 800;
// Une nouvelle vue au plus toutes les 50 ms pendant la rotation (la trame est recalculée à chaque fois).
const REDRAW_MS = 50;
// Vue de face du moteur pour une illustration (resetView) : la trame reste ainsi tournée vers soi.
const FRONT = { theta: 0, phi: Math.PI / 2 };

type ModelImage = EngineImage & { model?: string; lum?: unknown; blurL?: unknown; blurR?: number };
/** Ce qui est enregistré d'une illustration 3D : son angle et si elle est aplatie. */
export type ModelState = { yaw: number; pitch: number; flat: boolean };
// size : taille dans le carré (sizing.ts), 1 = le modèle tient tout le carré
type View = ModelState & { def: ModelDef; size: number; dirty: boolean; last: number };
type DotSet = { px: Float32Array; py: Float32Array; ps: Float32Array; pd: Float32Array };

/**
 * Le moteur rebat ses pastilles à chaque nouvelle trame : chaque pastille garde sa taille, sa couleur
 * et son mouvement propres, mais change de place. Sur un modèle qui tourne (une trame toutes les
 * 50 ms), elles sautaient d'un point à l'autre : la trame tremblait. Ici, chaque point de la grille
 * reprend la pastille qu'il avait (slots : point → pastille) ; seuls les points qui apparaissent
 * prennent une pastille libre. La première trame reste celle du moteur.
 */
export function keepSlots(set: DotSet, slots: Map<string, number>) {
  const n = set.px.length;
  const keys: (string | null)[] = [];
  for (let k = 0; k < n; k++) keys.push(set.ps[k] > 0 ? set.px[k] + ',' + set.py[k] : null);
  const order = new Int32Array(n).fill(-1); // place → pastille du moteur qui y va
  const taken = new Uint8Array(n);
  const waiting: number[] = [];
  keys.forEach((key, k) => {
    if (key === null) return;
    const slot = slots.get(key);
    if (slot !== undefined && slot < n && !taken[slot]) {
      order[slot] = k;
      taken[slot] = 1;
    } else waiting.push(k);
  });
  // places libres : d'abord celles des pastilles invisibles du moteur, gardées pour la fin
  const free: number[] = [];
  for (let k = 0; k < n; k++) if (!taken[k]) free.push(k);
  const hidden = keys.flatMap((key, k) => (key === null ? [k] : []));
  [...waiting, ...hidden].forEach((k, i) => (order[free[i]] = k));
  const copy = { px: set.px.slice(), py: set.py.slice(), ps: set.ps.slice(), pd: set.pd.slice() };
  slots.clear();
  for (let slot = 0; slot < n; slot++) {
    const k = order[slot];
    set.px[slot] = copy.px[k];
    set.py[slot] = copy.py[k];
    set.ps[slot] = copy.ps[k];
    set.pd[slot] = copy.pd[k];
    if (keys[k] !== null) slots.set(keys[k]!, slot);
  }
}

/**
 * La rotation demandée au moteur (écart de sa caméra avec la vue de face) passe au modèle :
 * la caméra revient de face. Renvoie vrai si le modèle a tourné.
 */
export function takeRotation(orbit: { theta: number; phi: number }, view: { yaw: number; pitch: number }) {
  const dTheta = orbit.theta - FRONT.theta;
  const dPhi = orbit.phi - FRONT.phi;
  if (Math.abs(dTheta) < 1e-5 && Math.abs(dPhi) < 1e-5) return false;
  view.yaw -= dTheta;
  view.pitch = Math.min(1.3, Math.max(-1.3, view.pitch - dPhi));
  orbit.theta = FRONT.theta;
  orbit.phi = FRONT.phi;
  return true;
}

export function createModelViews(core: PrototypeEngine, changed: () => void) {
  const views = new WeakMap<ModelImage, View>();
  const slots = new WeakMap<ModelImage, Map<string, number>>();
  const objects = new Map<string, Promise<THREE.Group | null>>();
  let stage: {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    pivot: THREE.Group;
  } | null = null;

  // Un seul petit moteur 3D pour tous les modèles, créé au premier besoin.
  const getStage = () => {
    if (stage) return stage;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0xffffff, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene();
    // lumière de studio : une lampe principale de côté (une face éclairée, l autre dans l ombre),
    // un contre-jour léger, un sol sombre
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(-4, 2, 1.5);
    const rim = new THREE.DirectionalLight(0xffffff, 0.2);
    rim.position.set(3, -1, -2);
    const pivot = new THREE.Group();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 0.55), key, rim, pivot);
    // le modèle tient dans une sphère de rayon 1 : il reste entier sous tous les angles
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 1.05 / Math.sin((15 * Math.PI) / 180));
    camera.lookAt(0, 0, 0);
    stage = { renderer, scene, camera, pivot };
    return stage;
  };

  // Le modèle, centré et ramené à une sphère de rayon 1 (chargé une fois).
  const load = (def: ModelDef) => {
    if (!objects.has(def.id))
      objects.set(
        def.id,
        new GLTFLoader()
          .loadAsync(def.url)
          .then(({ scene }) => {
            const box = new THREE.Box3().setFromObject(scene);
            const center = box.getCenter(new THREE.Vector3());
            const radius = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
            // Les textures de ces modèles sont presque blanches : la trame n'y verrait rien.
            // On dessine la forme en gris satiné, ses ombres et ses reflets portent le volume.
            const material = new THREE.MeshPhongMaterial({
              color: 0x8a8a8a,
              specular: 0x777777,
              shininess: 80,
              side: THREE.DoubleSide,
            });
            scene.traverse((object) => {
              if (object.isMesh) object.material = material;
            });
            const holder = new THREE.Group();
            scene.position.sub(center);
            holder.add(scene);
            holder.scale.setScalar(1 / radius);
            return holder;
          })
          .catch((error: unknown) => {
            console.error(error);
            return null;
          }),
      );
    return objects.get(def.id)!;
  };

  // Dessine le modèle sous l'angle de la vue, dans le canvas de l'image, puis relance la trame.
  const draw = async (image: ModelImage, view: View) => {
    const object = await load(view.def);
    if (!object) return;
    const { renderer, scene, camera, pivot } = getStage();
    pivot.rotation.set(view.pitch, 0, 0);
    pivot.scale.setScalar(view.size);
    object.rotation.set(0, view.yaw, 0);
    pivot.remove(...pivot.children); // un seul modèle à la fois sur la scène
    pivot.add(object);
    // aplatie : fond transparent (le moteur pose l'image sur du blanc, la trame ne change pas)
    renderer.setClearColor(0xffffff, view.flat ? 0 : 1);
    renderer.render(scene, camera);
    const ctx = image.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (!view.flat) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    ctx.drawImage(renderer.domElement, 0, 0, SIZE, SIZE);
    // caches du moteur pour cette image (luminance, flou) : à recalculer
    delete image.lum;
    delete image.blurL;
    delete image.blurR;
    core.imgDirty = true;
  };

  return {
    defs: MODELS,
    /** Canvas vide d'une illustration 3D, rempli quand le modèle est chargé. */
    blank() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      return canvas;
    },
    /** Relie une illustration à son modèle et dessine sa première vue (angle enregistré, s'il y en a un). */
    attach(image: ModelImage, modelId: string, state?: Partial<ModelState>) {
      const def = MODELS.find((d) => d.id === modelId);
      if (!def || views.has(image)) return;
      image.model = modelId;
      const view: View = {
        def,
        yaw: typeof state?.yaw === 'number' ? state.yaw : def.yaw,
        pitch: typeof state?.pitch === 'number' ? state.pitch : def.pitch,
        flat: state?.flat === true,
        size: 1,
        dirty: false,
        last: 0,
      };
      views.set(image, view);
      void draw(image, view).then(() => {
        delete image.thumb; // vignette recalculée avec la vraie vue
        changed();
      });
    },
    /** Copie d'une illustration 3D : même modèle, même angle, son propre canvas. */
    copyView(from: ModelImage, to: ModelImage) {
      const view = views.get(from);
      const canvas = this.blank();
      canvas.getContext('2d')?.drawImage(from.canvas, 0, 0);
      to.canvas = canvas;
      if (!view) return;
      views.set(to, { ...view, dirty: false, last: 0 });
    },
    isModel: (image: EngineImage | undefined) => Boolean(image && views.has(image as ModelImage)),
    /** Angle et aplatissement d'une illustration 3D (ce que « Enregistrer » garde). */
    stateOf(image: EngineImage | undefined): ModelState | undefined {
      const view = image && views.get(image as ModelImage);
      return view ? { yaw: view.yaw, pitch: view.pitch, flat: view.flat } : undefined;
    },
    /** Taille du modèle dans son carré (sizing.ts). */
    setSize(image: EngineImage | undefined, size: number) {
      const view = image && views.get(image as ModelImage);
      if (!image || !view || view.size === size) return;
      view.size = size;
      void draw(image as ModelImage, view).then(() => {
        delete image.thumb;
        changed();
      });
    },
    /**
     * Aplatir : l'illustration devient l'image figée de la vue actuelle, sur fond transparent, et tourne
     * comme les autres. Repasser en 3D : la trame revient de face et la souris tourne de nouveau le modèle.
     */
    setFlat(image: EngineImage | undefined, flat: boolean) {
      const view = image && views.get(image as ModelImage);
      if (!image || !view || view.flat === flat) return;
      view.flat = flat;
      core.resetView();
      void draw(image as ModelImage, view).then(() => {
        delete image.thumb;
        changed();
      });
    },
    /**
     * À chaque image du moteur : la rotation demandée (souris, inertie, rotation automatique) est
     * reportée sur le modèle, et la trame revient face à soi.
     */
    tick(now: number) {
      if (core.S.app !== 'image') return;
      // nouvelle trame à faire : on la fait ici pour que chaque point garde sa pastille
      if (core.imgDirty) {
        core.buildImageSets();
        (core.imgList as ModelImage[]).forEach((image, index) => {
          const set = core.imgSets[index] as DotSet | undefined;
          if (!set || !views.has(image)) return;
          if (!slots.has(image)) slots.set(image, new Map());
          keepSlots(set, slots.get(image)!);
        });
      }
      if (core.imgTr) return;
      const image = core.imgList[core.curImg] as ModelImage | undefined;
      const view = image && views.get(image);
      if (!image || !view || view.flat) return;
      if (takeRotation(core.orbit, view)) view.dirty = true;
      if (view.dirty && now - view.last >= REDRAW_MS) {
        view.dirty = false;
        view.last = now;
        void draw(image, view);
      }
    },
  };
}

export type ModelViews = ReturnType<typeof createModelViews>;
