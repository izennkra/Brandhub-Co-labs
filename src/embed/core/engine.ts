import { Euler, Quaternion } from 'three';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { getStore, openStore } from './memoryStore';

// Le moteur Co-labs pour les scripts d'intégration : chargé une seule fois par page, tel quel (aucune
// modification du moteur). Trois branchements sont posés autour de lui, au chargement :
// 1. stockage : il lit le stockage en mémoire du script (memoryStore.ts), rien chez le visiteur ;
// 2. fond transparent : son fond devient invisible quand la balise le demande ;
// 3. axes X, Y, Z : rotation du dessin selon les axes de l'écran, animée en douceur.
// Un seul moteur par page : une page affiche soit un motif, soit une illustration.

/** Point de vue de la caméra du moteur (radians, distance). */
export type View = { theta: number; phi: number; radius: number };

const SMOOTH = 0.3; // constante de temps des animations d'orientation, en secondes (≈ 1 s pour finir)

let enginePromise: Promise<Engine> | null = null;
let transparent = false;
// Axes : la rotation visée, celle affichée (qui la rejoint en douceur) et son inverse, appliquée à la caméra.
const axesTarget = new Quaternion();
const axesShown = new Quaternion();
const axesInverse = new Quaternion();
let lastFrame = 0;

/** Fond transparent : la page se voit derrière le dessin. */
export function setTransparent(on: boolean) {
  transparent = on;
}

/** Orientation visée (radians, axes de l'écran) ; immediate : sans animation (au chargement). */
export function setAxes(axes: [number, number, number], immediate: boolean) {
  axesTarget.setFromEuler(new Euler(...axes));
  if (immediate) axesShown.copy(axesTarget);
}

/** Écrit un réglage du moteur (les couleurs des points sont un ensemble pour lui). */
export function setSetting(S: Record<string, unknown>, key: string, value: unknown) {
  S[key] = key === 'dots' ? new Set(value as string[]) : value;
}

/** Le moteur, chargé une seule fois. Les données du stockage doivent être déposées avant. */
export function engine() {
  // Les modèles 3D de l'Illustration ne sont pas livrés (core/no-models.ts) : le moteur ne les crée pas.
  (window as Window & { __engineTestHooks?: { noModels?: boolean } }).__engineTestHooks ??= {
    noModels: true,
  };
  enginePromise ??= import('../../lib/pattern-engine/createEngine').then(({ getEngine }) =>
    getEngine().then((ready) => {
      connectStore(ready);
      connectTransparency(ready);
      connectAxes(ready);
      return ready;
    }),
  );
  return enginePromise;
}

// 1. Le moteur a son propre accès au stockage (core.Store) : il lit lui aussi le stockage en mémoire,
//    puis la bibliothèque, qui attendait son ouverture, peut démarrer.
function connectStore({ core }: Engine) {
  const memory = getStore();
  Object.assign(core.Store, { list: memory.list, get: memory.get, put: memory.put, del: memory.del });
  openStore();
}

// 2. Le moteur repeint son fond à chaque image (setClearColor, opacité 1) : on rend ce fond invisible
//    au passage, comme les exports PNG de l'outil.
function connectTransparency({ core }: Engine) {
  const { renderer } = core;
  const setClearColor = renderer.setClearColor.bind(renderer);
  renderer.setClearColor = (color, alpha) => setClearColor(color, transparent ? 0 : alpha);
}

// 3. Tourner le dessin revient à tourner la caméra en sens inverse autour de lui. Le moteur replace
//    sa caméra à chaque image (updateCamera, puis camera.lookAt) : on ajoute la rotation juste après.
//    Rien n'est redessiné, et le survol (calculé avec la caméra) reste juste.
function connectAxes({ core }: Engine) {
  const { camera, orbit } = core;
  const lookAt = camera.lookAt.bind(camera) as unknown as (target: typeof orbit.target) => void;
  camera.lookAt = ((target: typeof orbit.target) => {
    lookAt(target);
    // l'orientation affichée rejoint la visée en douceur (même vitesse quel que soit l'écran)
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    axesShown.slerp(axesTarget, 1 - Math.exp(-dt / SMOOTH));
    axesInverse.copy(axesShown).invert();
    if (Math.abs(axesInverse.w) > 0.999999) return;
    const distance = camera.position.distanceTo(orbit.target);
    camera.quaternion.multiply(axesInverse);
    camera.position.set(0, 0, distance).applyQuaternion(camera.quaternion).add(orbit.target);
  }) as unknown as typeof camera.lookAt;
}
