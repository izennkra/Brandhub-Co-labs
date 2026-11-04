import {
  COMMON_ATTRIBUTES,
  DEG,
  num,
  readAdvanced,
  readColors,
  readHover,
  yesNo,
  type Read,
} from '../core/attributes';
import type { View } from '../core/engine';

// Réglages de <colabs-motif> : les deux formes des maquettes, et la lecture des attributs propres au
// motif (forme, point de vue, rotation, élargissement, particules). Les attributs communs (fond,
// couleurs, survol, axes, format, réglages avancés) sont lus par core/attributes.ts.
// Le résultat a les mêmes clés qu'un préréglage de l'outil (réglages, _seed, _view).
// Fichier sans moteur : testable seul.

type Forme = { tirage: number[]; filMode: number; view: View; reglages: Record<string, unknown> };

// Base commune : membrane, fond clair, points brun, ciel et lin (comme les maquettes).
const BASE: Record<string, unknown> = {
  app: 'motif',
  qStruct: 1,
  bg: 'lin',
  dots: ['brun', 'ciel', 'lin'],
  autoRotate: true,
  rotSpeed: 0.6,
  hoverOn: true,
};

// Les deux formes des maquettes, imitées : un trèfle étiré (famille « Ample » du moteur), avec la
// déformation, l'angle et la vue retrouvés par calcul en comparant sa silhouette à chaque maquette.
// « tirage » : les valeurs que le moteur lit pour dessiner la forme (shapeSeed.ts) ; les 30 premières
// ne servent qu'aux autres structures, d'où 0,5. Angle de vue resserré (fov 36) comme les maquettes.
const tirage = (knot: number[]) => [...Array<number>(30).fill(0.5), ...knot];
export const FORMES: Record<'A' | 'B', Forme> = {
  // 3e image : grande boucle en bas à gauche, partie large en haut, trait qui remonte à droite
  A: {
    tirage: tirage([
      0.166667, 0.490701, 0.016095, 1, 0, 0.317663, 0.930744, 0.692447, 0.256845, 0.322328, 0.759442,
      0.668753, 0.41059, 0.248473, 0.21277, 0.377693, 0.27705, 0.243139, 0.770779,
    ]),
    filMode: 1,
    view: { theta: 4.170808, phi: 0.611979, radius: 118 },
    reglages: { fov: 36 },
  },
  // 2e image : anneaux allongés qui se croisent, partie large en diagonale au centre
  B: {
    tirage: tirage([
      0.166667, 0.429207, 0.295357, 0.807986, 0.5, 0.5, 0.5, 0, 0, 0, 0.5, 0.5, 0.5, 0, 0, 0, 0.72405,
      0.394068, 0.378157,
    ]),
    filMode: 1,
    view: { theta: 1.369241, phi: 0.941062, radius: 100 },
    reglages: { fov: 36 },
  },
};

export const MOTIF_ATTRIBUTES = [
  'forme',
  'graine',
  'forme-du-fil',
  'rotation',
  'inclinaison',
  'distance',
  'rotation-auto',
  'vitesse-rotation',
  'elargir',
  'renflements',
  'gonflement',
  'finesse-cols',
  'epaisseur',
  'particules',
  ...COMMON_ATTRIBUTES,
] as const;

/** Réglages appliqués en direct, sans redessiner la forme (couleurs, rotation, survol ; la vue à part). */
export const LIVE_KEYS = [
  'autoRotate',
  'rotSpeed',
  'bg',
  'dots',
  'hoverOn',
  'hoverMode',
  'hoverRadius',
  'hoverForce',
  'hoverIn',
  'hoverOut',
] as const;

// Ruban sans élargissement : renflements au minimum (valeurs basses des curseurs du moteur).
export const NOT_WIDENED = { junction: 0.4, thin: 0.6 };

const FIL = { noeud: 0, ample: 1, simple: 2 } as const;

/** Réglages du motif pour le moteur (mêmes clés qu'un préréglage : réglages, _seed et _view). */
export function readMotifSettings(read: Read): Record<string, unknown> {
  const forme = FORMES[read('forme')?.trim().toUpperCase() === 'B' ? 'B' : 'A'];
  return {
    ...BASE,
    ...forme.reglages,
    ...readShape(read, forme),
    _view: readView(read, forme.view),
    ...readRotation(read),
    ...readWidening(read),
    ...readColors(read), // fond « transparent » : géré à part (core/engine.ts)
    ...readHover(read),
    ...readParticles(read),
    // Tous les autres réglages avancés, tels que dans un préréglage : reglages='{"swirl":0.4}'.
    ...readAdvanced(read('reglages')),
  };
}

// Forme : celle de la maquette (tirage), ou une graine précise ; famille du fil.
function readShape(read: Read, forme: Forme) {
  const o: Record<string, unknown> = { shapeMode: forme.filMode };
  const graine = num(read('graine'), 0, 999_999_999);
  o._seed = graine === undefined ? forme.tirage : Math.round(graine);
  const fil = read('forme-du-fil')?.trim().toLowerCase().replace('œ', 'oe');
  if (fil && fil in FIL) o.shapeMode = FIL[fil as keyof typeof FIL];
  return o;
}

// Point de vue : rotation autour de la forme, inclinaison (0 = de face, 90 = vue du dessus), distance.
function readView(read: Read, base: View): View {
  const view = { ...base };
  const rotation = num(read('rotation'), -360, 360);
  if (rotation !== undefined) view.theta = rotation * DEG;
  const inclinaison = num(read('inclinaison'), -89, 89);
  if (inclinaison !== undefined) view.phi = (90 - inclinaison) * DEG;
  const distance = num(read('distance'), 5, 180);
  if (distance !== undefined) view.radius = distance;
  return view;
}

// Rotation automatique et sa vitesse (le signe donne le sens).
function readRotation(read: Read) {
  const o: Record<string, unknown> = {};
  const auto = yesNo(read('rotation-auto'));
  if (auto !== undefined) o.autoRotate = auto;
  const vitesse = num(read('vitesse-rotation'), -4, 4);
  if (vitesse !== undefined) o.rotSpeed = vitesse;
  return o;
}

// Élargir : renflements de la membrane. « non » : ruban régulier (renflements au plus fin).
function readWidening(read: Read) {
  const o: Record<string, unknown> = {};
  const renflements = num(read('renflements'), 1, 12);
  if (renflements !== undefined) o.lobes = Math.round(renflements);
  const gonflement = num(read('gonflement'), 0.4, 2);
  if (gonflement !== undefined) o.junction = gonflement;
  const finesse = num(read('finesse-cols'), 0.02, 0.6);
  if (finesse !== undefined) o.thin = finesse;
  const epaisseur = num(read('epaisseur'), 0.3, 6);
  if (epaisseur !== undefined) o.tubeR = epaisseur;
  if (yesNo(read('elargir')) === false) Object.assign(o, NOT_WIDENED);
  return o;
}

// Densité des points.
function readParticles(read: Read) {
  const particules = num(read('particules'), 2000, 120000);
  return particules === undefined ? {} : { qCount: Math.round(particules) };
}
