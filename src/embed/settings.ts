// Réglages du motif intégré sur un site (<colabs-motif>) : formes proposées, et lecture des attributs
// en français. Fichier sans moteur : testable seul, et la page de démo s'en sert pour écrire le code.

export const PALETTE_IDS = ['brun', 'orange', 'taupe', 'grege', 'lin', 'sauge', 'ciel'] as const;

export type View = { theta: number; phi: number; radius: number };
export type Forme = { tirage: number[]; filMode: number; view: View; reglages: Record<string, unknown> };

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

export const ATTRIBUTES = [
  'forme',
  'graine',
  'forme-du-fil',
  'rotation',
  'inclinaison',
  'distance',
  'axe-x',
  'axe-y',
  'axe-z',
  'rotation-auto',
  'vitesse-rotation',
  'elargir',
  'renflements',
  'gonflement',
  'finesse-cols',
  'epaisseur',
  'fond',
  'format',
  'couleurs',
  'survol',
  'survol-zone',
  'survol-taille',
  'survol-force',
  'survol-ouverture',
  'survol-reconstruction',
  'particules',
  'reglages',
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
type Read = (name: Attribute) => string | null;

const FIL = { noeud: 0, ample: 1, simple: 2 } as const;
const DEG = Math.PI / 180;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const num = (raw: string | null, min: number, max: number) => {
  if (raw === null || raw.trim() === '') return undefined;
  const v = Number(raw.replace(',', '.'));
  return Number.isFinite(v) ? clamp(v, min, max) : undefined;
};
const yesNo = (raw: string | null) =>
  raw === null ? undefined : !/^(non|no|false|0|off)$/i.test(raw.trim());

/** Réglages pour le moteur (mêmes clés qu'un préréglage : réglages, _seed et _view). */
export function readSettings(read: Read): Record<string, unknown> {
  const forme = FORMES[read('forme')?.trim().toUpperCase() === 'B' ? 'B' : 'A'];
  const o: Record<string, unknown> = { ...BASE, shapeMode: forme.filMode, ...forme.reglages };
  const view = { ...forme.view };

  const graine = num(read('graine'), 0, 999_999_999);
  o._seed = graine === undefined ? forme.tirage : Math.round(graine);
  const fil = read('forme-du-fil')?.trim().toLowerCase().replace('œ', 'oe') as keyof typeof FIL | undefined;
  if (fil && fil in FIL) o.shapeMode = FIL[fil];

  // Orientation : rotation autour de la forme, inclinaison (0 = de face, 90 = vue du dessus), distance.
  const rotation = num(read('rotation'), -360, 360);
  if (rotation !== undefined) view.theta = rotation * DEG;
  const inclinaison = num(read('inclinaison'), -89, 89);
  if (inclinaison !== undefined) view.phi = (90 - inclinaison) * DEG;
  const distance = num(read('distance'), 5, 180);
  if (distance !== undefined) view.radius = distance;
  o._view = view;

  const auto = yesNo(read('rotation-auto'));
  if (auto !== undefined) o.autoRotate = auto;
  const vitesse = num(read('vitesse-rotation'), -4, 4);
  if (vitesse !== undefined) o.rotSpeed = vitesse;

  // Élargir : renflements de la membrane. « non » : ruban régulier (renflements au plus fin).
  const renflements = num(read('renflements'), 1, 12);
  if (renflements !== undefined) o.lobes = Math.round(renflements);
  const gonflement = num(read('gonflement'), 0.4, 2);
  if (gonflement !== undefined) o.junction = gonflement;
  const finesse = num(read('finesse-cols'), 0.02, 0.6);
  if (finesse !== undefined) o.thin = finesse;
  const epaisseur = num(read('epaisseur'), 0.3, 6);
  if (epaisseur !== undefined) o.tubeR = epaisseur;
  if (yesNo(read('elargir')) === false) Object.assign(o, NOT_WIDENED);

  // fond « transparent » : géré par la balise (colabs-motif.ts) ; le moteur garde sa couleur de base
  const fond = read('fond')?.trim().toLowerCase();
  if (fond && (PALETTE_IDS as readonly string[]).includes(fond)) o.bg = fond;
  const couleurs = (read('couleurs') ?? '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((c) => (PALETTE_IDS as readonly string[]).includes(c));
  if (couleurs.length) o.dots = couleurs;

  // Survol : déconstruction de la forme au passage de la souris (réglages du moteur, section Survol).
  const survol = yesNo(read('survol'));
  if (survol !== undefined) o.hoverOn = survol;
  const zone = read('survol-zone')?.trim().toLowerCase();
  if (zone === 'curseur') o.hoverMode = 0;
  else if (zone === 'forme') o.hoverMode = 1;
  const taille = num(read('survol-taille'), 40, 500);
  if (taille !== undefined) o.hoverRadius = Math.round(taille);
  const force = num(read('survol-force'), 0.1, 3);
  if (force !== undefined) o.hoverForce = force;
  const ouverture = num(read('survol-ouverture'), 0.05, 2);
  if (ouverture !== undefined) o.hoverIn = ouverture;
  const reconstruction = num(read('survol-reconstruction'), 0.1, 4);
  if (reconstruction !== undefined) o.hoverOut = reconstruction;
  const particules = num(read('particules'), 2000, 120000);
  if (particules !== undefined) o.qCount = Math.round(particules);

  // Tous les autres réglages avancés, tels que dans un préréglage : reglages='{"swirl":0.4}'.
  const raw = read('reglages');
  if (raw) {
    try {
      const extra = JSON.parse(raw);
      if (extra && typeof extra === 'object' && !Array.isArray(extra)) Object.assign(o, extra);
    } catch {
      // réglages illisibles : ignorés, le motif s'affiche avec le reste
    }
  }
  return o;
}

// Ruban sans élargissement : renflements au minimum (valeurs basses des curseurs du moteur).
export const NOT_WIDENED = { junction: 0.4, thin: 0.6 };

/** Fond transparent : la page se voit derrière le motif (fond="transparent"). */
export const isTransparent = (read: Read) => read('fond')?.trim().toLowerCase() === 'transparent';

/** Format du bloc : « 16/9 », « 1:1 », « 4x5 »… → valeur CSS aspect-ratio (« 16 / 9 »), sinon null. */
export function readFormat(raw: string | null) {
  const m = raw?.trim().match(/^(\d+(?:[.,]\d+)?)\s*[/:x×]\s*(\d+(?:[.,]\d+)?)$/i);
  if (!m) return null;
  const [w, h] = [m[1], m[2]].map((v) => Number(v.replace(',', '.')));
  return w > 0 && h > 0 ? `${w} / ${h}` : null;
}

/**
 * Rotation de la forme selon les axes de l'écran, en degrés → radians [x, y, z] :
 * X bascule la forme vers l'avant ou l'arrière, Y la tourne à gauche ou à droite, Z la fait pivoter
 * dans le plan de l'écran. S'ajoute au point de vue (rotation, inclinaison, distance).
 */
export function readAxes(read: Read): [number, number, number] {
  return (['axe-x', 'axe-y', 'axe-z'] as const).map((name) => (num(read(name), -360, 360) ?? 0) * DEG) as [
    number,
    number,
    number,
  ];
}

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
