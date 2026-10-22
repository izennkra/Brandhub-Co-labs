// Formats des layouts (Layout editor, filtre de la page Patterns prédéfinis).
export const LAYOUT_FORMATS = ['1:1', '4:5', '9:16', '16:9', '4:3', 'A4', 'Bannière'];

/** Taille en pixels de chaque format (FMT du prototype, ligne 3611). */
export const LAYOUT_SIZES: Record<string, readonly [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
  '4:3': [1440, 1080],
  A4: [2480, 3508],
  Bannière: [1500, 500],
};

/** Format d'une taille : son nom s'il est connu, sinon « Libre ». */
export const formatOf = (w: number, h: number) =>
  Object.keys(LAYOUT_SIZES).find((name) => LAYOUT_SIZES[name][0] === w && LAYOUT_SIZES[name][1] === h) ??
  'Libre';
