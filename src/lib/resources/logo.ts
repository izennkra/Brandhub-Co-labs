import { hexToOklab, isLight, normalizeHex } from './colors';

// Déclinaisons des logos : un SVG déposé une fois est recoloré dans chaque couleur de la marque,
// puis exporté en SVG, PNG ou PDF.

/** Retire d'un SVG déposé tout ce qui pourrait exécuter du code (scripts, attributs « on… », liens javascript:). */
export function sanitizeSvg(svg: string) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return null;
  root.querySelectorAll('script, foreignObject').forEach((el) => el.remove());
  for (const el of [root, ...root.querySelectorAll('*')])
    for (const attr of [...el.attributes])
      if (/^on/i.test(attr.name) || (/href$/i.test(attr.name) && /^\s*javascript:/i.test(attr.value)))
        el.removeAttribute(attr.name);
  return new XMLSerializer().serializeToString(root);
}

const isPaint = (value: string | null) =>
  !!value &&
  !/^(none|transparent|inherit|currentcolor)$/i.test(value.trim()) &&
  !/^url\(/i.test(value.trim());

const PAINT_PROPS = ['fill', 'stroke', 'stop-color'];
const STYLE_PAINT = /(fill|stroke|stop-color)\s*:\s*([^;}"]+)/gi;

/** Le logo dans une seule couleur : chaque remplissage et contour coloré prend `hex`. */
export function recolorSvg(svg: string, hex: string) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return svg;
  const swap = (css: string) =>
    css.replace(STYLE_PAINT, (match, prop: string, value: string) =>
      isPaint(value) ? `${prop}:${hex}` : match,
    );
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const prop of PAINT_PROPS) if (isPaint(el.getAttribute(prop))) el.setAttribute(prop, hex);
    const style = el.getAttribute('style');
    if (style) el.setAttribute('style', swap(style));
    if (el.nodeName === 'style' && el.textContent) el.textContent = swap(el.textContent);
  }
  // les formes sans couleur sont noires par défaut : elles prennent aussi la couleur
  if (!root.hasAttribute('fill')) root.setAttribute('fill', hex);
  root.setAttribute('color', hex);
  return new XMLSerializer().serializeToString(root);
}

export type LogoColor = { name: string; hex: string };
export type LogoVariant = { name: string; svg: string; dark: boolean };

/** Deux couleurs impossibles à distinguer à l'œil (écart OKLab sous 0,02, ex. deux marrons à 2 nuances près). */
export function sameColor(a: string, b: string) {
  const [x, y] = [hexToOklab(a), hexToOklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 0.02;
}

const SHAPES = 'path, rect, circle, ellipse, polygon, polyline, line, text';

/** Couleurs utilisées par un SVG ; null s'il en contient qu'on ne sait pas lire (nom de couleur, fonction de couleur…). */
export function paintColors(svg: string): string[] | null {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return null;
  const found: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const prop of PAINT_PROPS) {
      const value = el.getAttribute(prop);
      if (isPaint(value)) found.push(value!);
    }
    const css = el.nodeName === 'style' ? el.textContent : el.getAttribute('style');
    for (const [, , value] of (css ?? '').matchAll(STYLE_PAINT)) if (isPaint(value)) found.push(value);
  }
  // une forme sans couleur nulle part au-dessus d'elle est noire par défaut
  const unpainted = [...root.querySelectorAll(SHAPES)].some(
    (el) =>
      !el.closest('[fill]') && !el.hasAttribute('class') && !/fill\s*:/.test(el.getAttribute('style') ?? ''),
  );
  if (unpainted) found.push('000000'); // noir (normalizeHex ajoute le #)
  const hexes = found.map(normalizeHex);
  return hexes.every(Boolean) ? [...new Set(hexes as string[])] : null;
}

/**
 * L'original, puis une déclinaison par couleur de la marque (fond foncé pour les couleurs claires).
 * Une couleur identique à l'œil à une autre déjà déclinée est écartée (ex. Neutre foncé ≈ Marron),
 * et l'original aussi quand il est d'une seule couleur de la marque (il serait en double).
 */
export function logoVariants(svg: string, colors: LogoColor[]): LogoVariant[] {
  const kept: string[] = [];
  const variants: LogoVariant[] = [];
  for (const color of colors) {
    const hex = normalizeHex(color.hex);
    if (!hex || kept.some((k) => sameColor(k, hex))) continue;
    kept.push(hex);
    variants.push({ name: color.name, svg: recolorSvg(svg, hex), dark: isLight(hex) });
  }
  const own = paintColors(svg);
  const single = own?.length && own.every((h) => sameColor(h, own[0])) ? own[0] : null;
  if (single && kept.some((k) => sameColor(k, single))) return variants;
  return [{ name: 'Original', svg, dark: false }, ...variants];
}

/** Nom affiché et nom de fichier : chaque logo est sur fond transparent (« Orange · fond transparent »). */
export const versionLabel = (variant: LogoVariant) => `${variant.name} · fond transparent`;

/** Logo en PDF vectoriel (jsPDF + svg2pdf, chargés seulement à l'export). */
export async function svgToPdf(svg: string) {
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const clean = sanitizeSvg(svg);
  if (!clean) throw new Error('SVG illisible');
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0';
  host.appendChild(
    document.importNode(new DOMParser().parseFromString(clean, 'image/svg+xml').documentElement, true),
  );
  document.body.appendChild(host);
  try {
    const el = host.querySelector('svg')!;
    const box = el.viewBox.baseVal;
    const width = box && box.width ? box.width : el.width.baseVal.value || 100;
    const height = box && box.height ? box.height : el.height.baseVal.value || 100;
    const pdf = new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'pt', format: [width, height] });
    await pdf.svg(el, { x: 0, y: 0, width, height });
    return pdf.output('blob');
  } finally {
    host.remove();
  }
}
