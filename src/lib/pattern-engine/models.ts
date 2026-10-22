// Illustrations en 3D : un modèle .glb (Prisme, Infini de Möbius) est dessiné sous l'angle voulu et
// cette vue sert d'image à l'Illustration ; la trame de pastilles du moteur s'y applique telle quelle.
// Quand on tourne l'illustration (souris ou rotation automatique), c'est le modèle qui tourne :
// la trame reste face à soi et suit la nouvelle vue. Le moteur n'est pas modifié.
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
type View = { def: ModelDef; yaw: number; pitch: number; dirty: boolean; last: number };

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
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
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
    object.rotation.set(0, view.yaw, 0);
    pivot.remove(...pivot.children); // un seul modèle à la fois sur la scène
    pivot.add(object);
    renderer.render(scene, camera);
    const ctx = image.canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, SIZE, SIZE);
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
    /** Relie une illustration à son modèle et dessine sa première vue. */
    attach(image: ModelImage, modelId: string) {
      const def = MODELS.find((d) => d.id === modelId);
      if (!def || views.has(image)) return;
      image.model = modelId;
      const view: View = { def, yaw: def.yaw, pitch: def.pitch, dirty: false, last: 0 };
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
    /**
     * À chaque image du moteur : la rotation demandée (souris, inertie, rotation automatique) est
     * reportée sur le modèle, et la trame revient face à soi.
     */
    tick(now: number) {
      if (core.S.app !== 'image' || core.imgTr) return;
      const image = core.imgList[core.curImg] as ModelImage | undefined;
      const view = image && views.get(image);
      if (!image || !view) return;
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
