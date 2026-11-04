// Réglages du motif intégré sur un site (<colabs-motif>) : formes proposées, et lecture des attributs
// en français. Fichier sans moteur : testable seul, et la page de démo s'en sert pour écrire le code.

export const PALETTE_IDS = ['brun', 'orange', 'taupe', 'grege', 'lin', 'sauge', 'ciel'] as const;

export type View = { theta: number; phi: number; radius: number };
export type Forme = { graine: number; filMode: number; view: View; reglages: Record<string, unknown> };

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

// Les deux formes proposées : graine (forme exacte), famille du fil (Nœud, Ample) et orientation.
// Points de départ : la page de démo permet d'en tirer d'autres et de copier leur graine.
const VUE = { theta: 0, phi: (80 * Math.PI) / 180, radius: 40 }; // de face, un peu au-dessus, cadrée
export const FORMES: Record<'A' | 'B', Forme> = {
  A: { graine: 101, filMode: 0, view: VUE, reglages: {} },
  B: { graine: 202, filMode: 1, view: VUE, reglages: {} },
};

export const ATTRIBUTES = [
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
  'fond',
  'couleurs',
  'survol',
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
  o._seed = graine === undefined ? forme.graine : Math.round(graine);
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

  const fond = read('fond')?.trim().toLowerCase();
  if (fond && (PALETTE_IDS as readonly string[]).includes(fond)) o.bg = fond;
  const couleurs = (read('couleurs') ?? '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((c) => (PALETTE_IDS as readonly string[]).includes(c));
  if (couleurs.length) o.dots = couleurs;

  const survol = yesNo(read('survol'));
  if (survol !== undefined) o.hoverOn = survol;
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
