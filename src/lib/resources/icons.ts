// Bibliothèque d'icônes de la marque : Central, servie par visual.systems (même source que les icônes
// de l'appli). Page Iconographie : recherche, variantes, liens d'intégration.

export const ICON_API = 'https://visual.systems/api/modules/icon';
export const ICON_SIZES = [16, 20, 24, 32, 40] as const;
export const CORNERS = [0, 1, 2, 3] as const;
export const STROKES = [1, 1.5, 2] as const;

export type IconOptions = {
  style: 'outlined' | 'filled';
  corner: (typeof CORNERS)[number];
  stroke: (typeof STROKES)[number];
  size: (typeof ICON_SIZES)[number];
};
export type IconResult = { name: string; svgUrl: string; jsxUrl: string };

/** Identifiant de variante Central, ex. « round-outlined-radius-2-stroke-1.5 ». */
export const variantId = ({ style, corner, stroke }: Pick<IconOptions, 'style' | 'corner' | 'stroke'>) =>
  `round-${style}-radius-${corner}-stroke-${stroke}`;

/** Lien de l'icône en SVG, à la taille et à la couleur voulues (sans couleur : currentColor). */
export function iconSvgUrl(name: string, variant: string, size: number, color: string | null) {
  const params = new URLSearchParams({ variant, size: String(size) });
  if (color) params.set('color', color);
  return `${ICON_API}/central/${encodeURIComponent(name)}.svg?${params}`;
}

const PAGE = 80; // le service renvoie 80 icônes au plus par page

/** Recherche (en anglais, avec synonymes) ; sans mot, toute la bibliothèque, page par page. */
export async function searchIcons(query: string, variant: string, offset: number) {
  const params = new URLSearchParams({
    set: 'central',
    q: query,
    variant,
    limit: String(PAGE),
    offset: String(offset),
  });
  const response = await fetch(`${ICON_API}/search?${params}`);
  const body = await response.json();
  if (!response.ok || !Array.isArray(body.icons)) throw new Error(body.error || 'recherche impossible');
  return {
    icons: body.icons as IconResult[],
    total: Number(body.total) || 0,
    nextOffset: (body.nextOffset as number | null) ?? null,
  };
}

/** Consignes à coller dans un agent de code pour utiliser les icônes de la marque. */
export function agentInstructions(variant: string, size: number) {
  return [
    '# Icônes de la marque Co-labs',
    '',
    'Bibliothèque : Central (visual.systems), une seule famille pour tout le produit.',
    `Variante : ${variant} ; taille par défaut : ${size} px.`,
    '',
    `Rechercher : GET ${ICON_API}/search?set=central&q=<mot anglais>&variant=${variant}&limit=8`,
    `Récupérer : GET ${ICON_API}/central/<nom>.jsx?variant=${variant} (ou .svg)`,
    '',
    '- Ajouter les icônes une par une dans le registre local ; ne pas charger la bibliothèque entière.',
    '- Couleur : currentColor, héritée du texte autour.',
    '- Bouton avec icône seule : un aria-label ; icône décorative : aria-hidden="true".',
    '',
    'Guide complet : https://visual.systems/modules/icon/llms.txt',
  ].join('\n');
}
