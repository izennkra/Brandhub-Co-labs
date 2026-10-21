// Icônes de la page Iconographie.

/** Le SVG à copier : taille demandée, et couleur appliquée aux tracés en « currentColor ». */
export function sizedSvg(svg: string, size: number, color: string | null) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return svg;
  root.setAttribute('width', String(size));
  root.setAttribute('height', String(size));
  if (color) root.setAttribute('color', color);
  return new XMLSerializer().serializeToString(root);
}
