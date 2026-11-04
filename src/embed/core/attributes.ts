// Lecture des attributs communs aux balises d'intégration (<colabs-motif>, <colabs-illustration>).
// Les attributs sont en français et tolérants : valeurs hors bornes ramenées dans les bornes, virgule
// décimale acceptée, valeur illisible ignorée (le réglage par défaut s'applique).
// Fichier sans moteur : testable seul.

/** Lit un attribut de la balise (null s'il est absent). */
export type Read = (name: string) => string | null;

/** Couleurs de la charte, telles que le moteur les nomme. */
export const PALETTE_IDS = ['brun', 'orange', 'taupe', 'grege', 'lin', 'sauge', 'ciel'] as const;

export const DEG = Math.PI / 180;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const isPaletteId = (id: string) => (PALETTE_IDS as readonly string[]).includes(id);

/** Nombre borné ; undefined si l'attribut est absent ou illisible. */
export function num(raw: string | null, min: number, max: number) {
  if (raw === null || raw.trim() === '') return undefined;
  const v = Number(raw.replace(',', '.'));
  return Number.isFinite(v) ? clamp(v, min, max) : undefined;
}

/** oui / non (aussi true / false, 1 / 0, on / off) ; undefined si l'attribut est absent. */
export const yesNo = (raw: string | null) =>
  raw === null ? undefined : !/^(non|no|false|0|off)$/i.test(raw.trim());

/** Liste de mots séparés par des espaces ou des virgules. */
export const words = (raw: string | null) =>
  (raw ?? '')
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean);

/** Fond transparent : la page se voit derrière le dessin (fond="transparent"). */
export const isTransparent = (read: Read) => read('fond')?.trim().toLowerCase() === 'transparent';

/** Format du bloc : « 16/9 », « 1:1 », « 4x5 »… → valeur CSS aspect-ratio (« 16 / 9 »), sinon null. */
export function readFormat(raw: string | null) {
  const m = raw?.trim().match(/^(\d+(?:[.,]\d+)?)\s*[/:x×]\s*(\d+(?:[.,]\d+)?)$/i);
  if (!m) return null;
  const [w, h] = [m[1], m[2]].map((v) => Number(v.replace(',', '.')));
  return w > 0 && h > 0 ? `${w} / ${h}` : null;
}

/**
 * Rotation selon les axes de l'écran, en degrés → radians [x, y, z] : X bascule le dessin vers
 * l'avant ou l'arrière, Y le tourne à gauche ou à droite, Z le fait pivoter dans le plan de l'écran.
 */
export function readAxes(read: Read): [number, number, number] {
  const axis = (name: string) => (num(read(name), -360, 360) ?? 0) * DEG;
  return [axis('axe-x'), axis('axe-y'), axis('axe-z')];
}

/** Couleurs : fond (couleur de la charte) et couleurs des points ; rien si non précisé. */
export function readColors(read: Read) {
  const o: Record<string, unknown> = {};
  const fond = read('fond')?.trim().toLowerCase();
  if (fond && isPaletteId(fond)) o.bg = fond;
  const couleurs = words(read('couleurs')?.toLowerCase() ?? null).filter(isPaletteId);
  if (couleurs.length) o.dots = couleurs;
  return o;
}

/** Survol : déconstruction au passage de la souris (réglages du moteur, section Survol). */
export function readHover(read: Read) {
  const o: Record<string, unknown> = {};
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
  return o;
}

/** Réglages avancés du moteur en JSON (attribut « reglages ») ; illisibles : ignorés. */
export function readAdvanced(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const extra = JSON.parse(raw);
    return extra && typeof extra === 'object' && !Array.isArray(extra) ? extra : {};
  } catch {
    return {};
  }
}

/** Attributs communs aux deux balises (format, fond, couleurs, axes, survol, réglages avancés). */
export const COMMON_ATTRIBUTES = [
  'fond',
  'format',
  'couleurs',
  'axe-x',
  'axe-y',
  'axe-z',
  'survol',
  'survol-zone',
  'survol-taille',
  'survol-force',
  'survol-ouverture',
  'survol-reconstruction',
  'reglages',
] as const;
