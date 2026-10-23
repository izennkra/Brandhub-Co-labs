import { RESOURCE_PAGES } from '../../app/navigation';
import { getStore } from '../store/store';
import { neutralScale, normalizeHex, paletteCss, paletteGroup } from './colors';
import { downloadZip, imageFileName, slug } from './download';
import { DEFAULT_FAMILY, familyFiles, type Family } from './fonts';
import { brandLogoColors, logoVariants, logoZipEntries } from './logo';

// Export complet des Ressources : un seul .zip, un dossier numéroté par section (dans l'ordre du menu),
// avec le contenu de chaque page, même celles qui ne sont pas ouvertes. Les données sont relues dans
// le stockage. Les sections sans fichier (Iconographie, QR code) et les sections vides sont omises.
export const EXPORT_NAME = 'brandhub-ressources.zip';

type Entry = { name: string; data: Blob | string };
type Color = { name: string; hex: string; group?: string };
type Neutrals = { light: string; dark: string };
type Image = { name: string; url: string };

async function list<T>(col: string): Promise<T[]> {
  const items = await getStore().list<T & { order?: number }>(col);
  return items.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0)).map((item) => item.data);
}

async function logoEntries(): Promise<Entry[]> {
  const [sections, colors, neutrals] = await Promise.all([
    list<{ name: string; svg?: string }>('res-logo-groups'),
    list<Color>('res-colors'),
    list<Neutrals>('res-neutrals'),
  ]);
  const brand = brandLogoColors(colors, neutrals[0]);
  return logoZipEntries(
    sections.filter((s) => s.svg).map((s) => ({ name: s.name, variants: logoVariants(s.svg!, brand) })),
  );
}

async function fontEntries(): Promise<Entry[]> {
  const stored = await list<Family>('res-fonts');
  return (stored.length ? stored : [DEFAULT_FAMILY]).flatMap((family) =>
    familyFiles(family).map((file) => ({ ...file, name: `${slug(family.name)}/${file.name}` })),
  );
}

async function colorEntries(): Promise<Entry[]> {
  const [colors, neutrals] = await Promise.all([list<Color>('res-colors'), list<Neutrals>('res-neutrals')]);
  const valid = colors.filter((c) => normalizeHex(c.hex));
  const palette = [
    ...valid.filter((c) => paletteGroup(c.group) === 'principale'),
    ...valid.filter((c) => paletteGroup(c.group) === 'secondaire'),
  ];
  const light = neutrals[0] && normalizeHex(neutrals[0].light);
  const dark = neutrals[0] && normalizeHex(neutrals[0].dark);
  const steps = light && dark ? neutralScale(light, dark) : null;
  if (!palette.length && !steps) return [];
  return [{ name: 'palette.css', data: new Blob([paletteCss(palette, steps)], { type: 'text/css' }) }];
}

const galleryEntries = (col: string) => async (): Promise<Entry[]> =>
  (await list<Image>(col)).map((image) => ({ name: imageFileName(image), data: image.url }));

const SECTIONS: Record<string, () => Promise<Entry[]>> = {
  '/ressources/logo': logoEntries,
  '/ressources/typographie': fontEntries,
  '/ressources/couleur': colorEntries,
  '/ressources/imagerie': galleryEntries('res-imagery'),
  '/ressources/patterns': galleryEntries('res-layouts'),
  '/ressources/inspiration': galleryEntries('res-inspiration'),
};

/** Un fichier distant est récupéré ; s'il manque, il est laissé de côté sans bloquer le reste. */
async function toBlob(data: Blob | string): Promise<Blob | null> {
  if (typeof data !== 'string') return data;
  try {
    const response = await fetch(data);
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
}

/** Deux fichiers du même nom dans un dossier : le second devient « nom-2.ext ». */
function uniqueName(name: string, taken: Set<string>) {
  let candidate = name;
  for (let n = 2; taken.has(candidate); n++) candidate = name.replace(/(\.[^./]+)?$/, `-${n}$1`);
  taken.add(candidate);
  return candidate;
}

/** Fichiers du .zip, rangés par section ; `include` écarte les sections verrouillées. */
export async function resourceExportEntries(include: (path: string) => boolean) {
  const entries: { name: string; data: Blob }[] = [];
  const taken = new Set<string>();
  for (const [index, page] of RESOURCE_PAGES.entries()) {
    const build = SECTIONS[page.path];
    if (!build || !include(page.path)) continue;
    const folder = `${String(index + 1).padStart(2, '0')}-${slug(page.label)}`;
    for (const entry of await build()) {
      const data = await toBlob(entry.data);
      if (data) entries.push({ name: uniqueName(`${folder}/${entry.name}`, taken), data });
    }
  }
  return entries;
}

/** Télécharge le .zip ; renvoie false s'il n'y a rien à exporter. */
export async function exportResources(include: (path: string) => boolean) {
  const entries = await resourceExportEntries(include);
  if (!entries.length) return false;
  await downloadZip(EXPORT_NAME, entries);
  return true;
}
