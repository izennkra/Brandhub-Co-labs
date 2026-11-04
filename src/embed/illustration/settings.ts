import {
  COMMON_ATTRIBUTES,
  num,
  readAdvanced,
  readColors,
  readHover,
  words,
  yesNo,
  type Read,
} from '../core/attributes';

// Réglages de <colabs-illustration> : liste des illustrations (fichier illustrations.json), lecture
// (durée, automatique ou pilotée par le site), cadrage et taille de chacune. Les attributs communs
// (fond, couleurs, survol, axes, format, réglages avancés) sont lus par core/attributes.ts.
// Fichier sans moteur : testable seul.

export const ILLUSTRATION_ATTRIBUTES = [
  'source',
  'images',
  'depart',
  'duree',
  'transition',
  'distance',
  'tailles',
  'lecture',
  'boucle',
  ...COMMON_ATTRIBUTES,
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
  /** Taille de l'objet dans son image, de 0,3 à 1,5 (1 = taille d'origine). */
  taille?: number;
};

/** Lecture : durée de chaque image (s), transition (s), automatique ou manuelle, en boucle ou non. */
export type Playback = { duree: number; transition: number | undefined; auto: boolean; boucle: boolean };

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

/** Distance de la caméra, commune à toutes les illustrations (cadrage du moteur : 74). */
export const DEFAULT_DISTANCE = 74;

// Taille de chaque illustration : bornes de l'outil (sizing.ts).
const SIZE_MIN = 0.3;
const SIZE_MAX = 1.5;
const clampSize = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(SIZE_MAX, Math.max(SIZE_MIN, v)) : 1;

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

export function readPlayback(read: Read): Playback {
  return {
    duree: num(read('duree'), 1, 120) ?? 6,
    transition: num(read('transition'), 0.2, 10),
    auto: read('lecture')?.trim().toLowerCase() !== 'manuelle',
    boucle: yesNo(read('boucle')) ?? true,
  };
}

export const readDistance = (read: Read) => num(read('distance'), 5, 180) ?? DEFAULT_DISTANCE;

/**
 * Tailles par illustration : celles du fichier, remplacées par l'attribut « tailles »
 * (ex. « prisme:0.9 adn:1.1 », point décimal). Absente : 1 (taille d'origine).
 */
export function readSizes(list: Illustration[], raw: string | null): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const { id, taille } of list) sizes[id] = clampSize(taille ?? 1);
  for (const pair of words(raw)) {
    const [id, value] = pair.split(':');
    const n = Number(value);
    if (id in sizes && Number.isFinite(n)) sizes[id] = clampSize(n);
  }
  return sizes;
}

/** Réglages imposés à toutes les illustrations (fond, couleurs, survol, réglages avancés). */
export const readOverrides = (read: Read): Record<string, unknown> => ({
  ...readColors(read),
  ...readHover(read),
  ...readAdvanced(read('reglages')),
});

/** Réglages propres à une illustration ; sans réglages : ceux de la première qui en a. */
export function settingsOf(list: Illustration[], illustration: Illustration | undefined) {
  return illustration?.reglages ?? list.find((i) => i.reglages)?.reglages;
}

/**
 * Documents du stockage en mémoire (core/memoryStore.ts), au format de la bibliothèque de l'outil :
 * « images » (nom, tons, ordre, taille), « imagesrc » (l'image), « imgsettings » (ses réglages).
 */
export function libraryDocuments(
  list: Illustration[],
  sources: string[],
  sizes: Record<string, number> = {},
) {
  const images: Record<string, unknown> = {};
  const imagesrc: Record<string, unknown> = {};
  const imgsettings: Record<string, unknown> = {};
  list.forEach((illustration, i) => {
    const { id, nom, tons } = illustration;
    const size = sizes[id] ?? 1;
    images[id] = {
      name: nom,
      tone: { ...DEFAULT_TONE, ...tons },
      inLoop: true,
      t: i + 1,
      // taille dans son carré : appliquée par la bibliothèque au chargement (même champ que l'outil)
      ...(size !== 1 ? { size } : {}),
    };
    imagesrc[id] = { src: sources[i] };
    const reglages = settingsOf(list, illustration);
    if (reglages) {
      // même cadrage pour toutes : le point de vue enregistré dans l'outil (_view) n'est pas repris,
      // sinon la taille sauterait d'une illustration à l'autre au moment de la transition
      const own: Record<string, unknown> = { ...reglages, app: 'image' };
      delete own._view;
      imgsettings[id] = { s: own };
    }
  });
  return { images, imagesrc, imgsettings };
}
