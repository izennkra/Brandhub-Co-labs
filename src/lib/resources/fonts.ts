import geistItalicUrl from '@fontsource-variable/geist/files/geist-latin-wght-italic.woff2?url';
import geistUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';

// Polices des Ressources : types, et Geist proposée d'office (page Typographie et export complet).
// static : une graisse, à installer (TTF, OTF) ; variable : toutes les graisses dans un fichier ; web : WOFF2.
export type FontKind = 'static' | 'variable' | 'web';
export type FontFile = { label: string; url: string; filename: string; kind?: FontKind };
export type Family = { name: string; role: string; weights: string; css: string; files: FontFile[] };

// Fichiers de Geist (licence libre OFL, paquet officiel « geist ») : chaque variante en TTF, à installer,
// les versions variables, et les fichiers web de l'appli.
export const GEIST = '/fonts/geist/';
const GEIST_STATICS = [
  ['Thin', 'Thin'],
  ['Thin Italic', 'ThinItalic'],
  ['ExtraLight', 'UltraLight'],
  ['ExtraLight Italic', 'ExtraLightItalic'],
  ['Light', 'Light'],
  ['Light Italic', 'LightItalic'],
  ['Regular', 'Regular'],
  ['Italic', 'Italic'],
  ['Medium', 'Medium'],
  ['Medium Italic', 'MediumItalic'],
  ['SemiBold', 'SemiBold'],
  ['SemiBold Italic', 'SemiBoldItalic'],
  ['Bold', 'Bold'],
  ['Bold Italic', 'BoldItalic'],
  ['ExtraBold Italic', 'ExtraBoldItalic'],
  ['Black', 'Black'],
  ['Black Italic', 'BlackItalic'],
  ['UltraBlack', 'UltraBlack'],
];

export const DEFAULT_FAMILY: Family = {
  name: 'Geist',
  role: 'Principale — interface, titres et texte',
  weights: '400 Regular · 500 Medium · 600 Semibold · 700 Bold',
  css: "font-family: 'Geist', system-ui, sans-serif;",
  files: [
    ...GEIST_STATICS.map(([label, file]) => ({
      label: `Geist ${label}`,
      url: `${GEIST}Geist-${file}.ttf`,
      filename: `Geist-${file}.ttf`,
      kind: 'static' as const,
    })),
    {
      label: 'Geist Variable',
      url: `${GEIST}Geist-Variable.ttf`,
      filename: 'Geist-Variable.ttf',
      kind: 'variable',
    },
    {
      label: 'Geist Italic Variable',
      url: `${GEIST}Geist-Italic-Variable.ttf`,
      filename: 'Geist-Italic-Variable.ttf',
      kind: 'variable',
    },
    { label: 'Geist (web)', url: geistUrl, filename: 'geist-variable.woff2', kind: 'web' },
    {
      label: 'Geist Italic (web)',
      url: geistItalicUrl,
      filename: 'geist-variable-italic.woff2',
      kind: 'web',
    },
  ],
};

/** Fichiers d'une famille pour un .zip (adresses à récupérer), licence comprise pour Geist. */
export const familyFiles = (family: Family) => [
  ...family.files.map((file) => ({ name: file.filename, data: file.url })),
  ...(family.name === 'Geist' ? [{ name: 'OFL.txt', data: `${GEIST}OFL.txt` }] : []),
];
