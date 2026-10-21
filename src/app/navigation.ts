import type { IconName } from '../components/Icon';

// Pages listées dans la colonne de gauche. Libellés repris du Figma, orthographe corrigée.
export type NavPage = { path: string; label: string; icon: IconName };
export type SectionId = 'tool' | 'resource';
export type Section = { id: SectionId; label: string; icon: IconName; pages: NavPage[] };

export const TOOL_PAGES: NavPage[] = [
  { path: '/outils/motif', label: 'Motif', icon: 'circle-dashed' },
  { path: '/outils/illustrations', label: 'Illustrations iconographiques', icon: 'circles-three' },
  { path: '/outils/layout-editor', label: 'Layout editor', icon: 'bezier' },
];

export const RESOURCE_PAGES: NavPage[] = [
  { path: '/ressources/logo', label: 'Logo', icon: 'vector-logo' },
  { path: '/ressources/typographie', label: 'Typographie', icon: 'text1' },
  { path: '/ressources/couleur', label: 'Couleur', icon: 'color-palette' },
  { path: '/ressources/iconographie', label: 'Iconographie', icon: 'shapes-plus-x-square-circle' },
  { path: '/ressources/imagerie', label: 'Imagerie', icon: 'images1' },
  { path: '/ressources/patterns', label: 'Patterns prédéfinis', icon: 'dot-grid3x3' },
  { path: '/ressources/inspiration', label: 'Inspiration', icon: 'lightbulb-glow' },
];

export const SECTIONS: Section[] = [
  { id: 'tool', label: 'Tool', icon: 'toolbox', pages: TOOL_PAGES },
  { id: 'resource', label: 'Ressource', icon: 'books', pages: RESOURCE_PAGES },
];

export function sectionOf(pathname: string): Section {
  return SECTIONS.find((section) => section.pages.some((page) => page.path === pathname)) ?? SECTIONS[0];
}

// Dernière page visitée dans chaque section, gardée le temps de l'onglet du navigateur.
const STORAGE_KEY = 'bhc.lastPage.';

export function rememberPage(section: Section, pathname: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY + section.id, pathname);
  } catch {
    // Stockage indisponible (navigation privée…) : on revient simplement à la première page.
  }
}

export function lastPage(section: Section): string {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(STORAGE_KEY + section.id);
  } catch {
    stored = null;
  }
  return section.pages.some((page) => page.path === stored) ? (stored as string) : section.pages[0].path;
}
