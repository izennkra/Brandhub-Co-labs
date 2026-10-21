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

// ---------- Neutres et nuances ----------
// Les mélanges se font dans l'espace OKLab : les paliers paraissent réguliers à l'œil.

type Lab = [number, number, number];

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

function hexToOklab(hex: string): Lab {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToHex([L, A, B]: Lab) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLinear);
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/** Mélange de deux couleurs (t = 0 : la première, t = 1 : la seconde). */
export function mix(a: string, b: string, t: number) {
  const [x, y] = [hexToOklab(a), hexToOklab(b)];
  return oklabToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Lab);
}

/** Paliers des neutres et des nuances : du plus clair (50) au plus foncé (950). */
export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Neutres : les paliers entre la couleur claire (50) et la couleur foncée (950). */
export function neutralScale(light: string, dark: string) {
  return STEPS.map((step, i) => ({ step, hex: mix(light, dark, i / (STEPS.length - 1)) }));
}

const WHITE = oklabToHex([1, 0, 0]);
const BLACK = oklabToHex([0, 0, 0]);
// part de blanc (au-dessus de 500) ou de noir (en dessous) mêlée à la couleur
const TINT: Record<number, number> = { 50: 0.92, 100: 0.84, 200: 0.68, 300: 0.5, 400: 0.26 };
const SHADE: Record<number, number> = { 600: 0.16, 700: 0.32, 800: 0.48, 900: 0.62, 950: 0.74 };

/** Nuances d'une couleur : 500 est la couleur elle-même, plus claire vers 50, plus foncée vers 950. */
export function shadeScale(hex: string) {
  return STEPS.map((step) => ({
    step,
    hex:
      step === 500
        ? normalizeHex(hex)!
        : step < 500
          ? mix(hex, WHITE, TINT[step])
          : mix(hex, BLACK, SHADE[step]),
  }));
}
