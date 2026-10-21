// Valeurs d'une couleur calculées depuis son code HEX (page Couleur).

/** « #ec5f14 », « EC5F14 » ou « #e51 » → « #EC5F14 » ; null si le code n'est pas valable. */
export function normalizeHex(input: string) {
  let hex = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

export function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B),
    l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const formatRgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b})`;
};

export const formatHsl = (hex: string) => {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `hsl(${h} ${s}% ${l}%)`;
};

/** Couleur claire ? (pour écrire en foncé par-dessus) — luminance relative WCAG. */
export function isLight(hex: string) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.4;
}
