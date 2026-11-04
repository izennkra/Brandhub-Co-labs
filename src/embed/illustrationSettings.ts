import { readAdvanced, readColors, readHover, num, yesNo, type Read } from './settings';

// Réglages de <colabs-illustration> : liste des illustrations (fichier illustrations.json), lecture
// (durée, automatique ou pilotée par le site), et réglages communs avec le motif (fond, couleurs,
// survol, axes, format). Fichier sans moteur : testable seul.

export const ILLUSTRATION_ATTRIBUTES = [
  'source',
  'images',
  'depart',
  'duree',
  'transition',
  'distance',
  'lecture',
  'boucle',
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

/** Une illustration du fichier illustrations.json. */
export type Illustration = {
  id: string;
  nom: string;
  /** Image (JPG, PNG, WEBP), chemin relatif au fichier illustrations.json. */
  fichier: string;
  /** Tons de l'image (luminosité, contraste…), comme dans l'outil ; sinon ceux par défaut. */
  tons?: Record<string, unknown>;
  /** Réglages de l'illustration (trame, couleurs, survol…), comme dans l'outil ; sinon ceux de la première. */
  reglages?: Record<string, unknown>;
};

// Tons par défaut d'une image ajoutée sans réglages (valeurs de départ de l'outil).
export const DEFAULT_TONE = {
  imgBright: 0,
  imgContr: 10,
  imgGamma: 1,
  imgLow: 8,
  imgHigh: 94,
  imgBlur: 1,
  imgInvert: false,
};

const words = (raw: string | null) =>
  (raw ?? '')
    .split(/[\s,]+/)
    .map((w) => w.trim())
    .filter(Boolean);

/** Illustrations à afficher, dans l'ordre de l'attribut « images » (sinon toutes, dans l'ordre du fichier). */
export function pickIllustrations(all: Illustration[], raw: string | null) {
  const wanted = words(raw);
  if (!wanted.length) return all;
  return wanted.map((id) => all.find((i) => i.id === id)).filter((i): i is Illustration => Boolean(i));
}

/** Position de départ : un numéro (à partir de 0) ou un identifiant ; sinon la première. */
export function startIndex(list: Illustration[], raw: string | null) {
  const value = raw?.trim();
  if (!value) return 0;
  const byId = list.findIndex((i) => i.id === value);
  if (byId >= 0) return byId;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < list.length ? n : 0;
}

/** Distance de la caméra, commune à toutes les illustrations (cadrage du moteur : 74). */
export const DEFAULT_DISTANCE = 74;
export const readDistance = (read: Read) => num(read('distance'), 5, 180) ?? DEFAULT_DISTANCE;

/** Lecture : durée de chaque image (s), transition (s), automatique ou manuelle, en boucle ou non. */
export function readPlayback(read: Read) {
  return {
    duree: num(read('duree'), 1, 120) ?? 6,
    transition: num(read('transition'), 0.2, 10),
    auto: read('lecture')?.trim().toLowerCase() !== 'manuelle',
    boucle: yesNo(read('boucle')) ?? true,
  };
}

/** Réglages imposés à toutes les illustrations (fond, couleurs, survol, réglages avancés). */
export const readOverrides = (read: Read): Record<string, unknown> => ({
  ...readColors(read),
  ...readHover(read),
  ...readAdvanced(read('reglages')),
});

/**
 * Documents du stockage en mémoire (memoryStore.ts), au format de la bibliothèque de l'outil :
 * « images » (nom, tons, ordre), « imagesrc » (l'image), « imgsettings » (ses réglages).
 */
export function libraryDocuments(list: Illustration[], sources: string[]) {
  const fallback = list.find((i) => i.reglages)?.reglages;
  const images: Record<string, unknown> = {};
  const imagesrc: Record<string, unknown> = {};
  const imgsettings: Record<string, unknown> = {};
  list.forEach((illustration, i) => {
    const { id, nom, tons, reglages = fallback } = illustration;
    images[id] = { name: nom, tone: { ...DEFAULT_TONE, ...tons }, inLoop: true, t: i + 1 };
    imagesrc[id] = { src: sources[i] };
    // même cadrage pour toutes : le point de vue enregistré dans l'outil (_view) n'est pas repris,
    // sinon la taille sauterait d'une illustration à l'autre au moment de la transition
    if (reglages) {
      const own: Record<string, unknown> = { ...reglages, app: 'image' };
      delete own._view;
      imgsettings[id] = { s: own };
    }
  });
  return { images, imagesrc, imgsettings };
}
