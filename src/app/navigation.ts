import type { IconName } from '../components/Icon';

// Modèle unique des pages : tout ce qui décrit une page (adresse, libellé, icône, contenu provisoire,
// sections de l'Éditeur) vit ici, au même endroit. Libellés repris du Figma, orthographe corrigée.
export type NavPage = { path: string; label: string; icon: IconName };

// Section du panneau Éditeur. « open » : dépliée à l'arrivée, comme sur la maquette.
export type EditorSection = { title: string; open?: boolean };

export type ToolPageDef = NavPage & {
  engine?: 'motif'; // page affichant le moteur de patterns dans la zone centrale
  pending: string; // texte d'attente, tant que la page n'a pas son contenu
  editorSections: EditorSection[]; // dans l'ordre du Figma
};

export type ResourcePageDef = NavPage & {
  description: string; // provisoire, à remplacer par les textes définitifs (partie resources)
};

export type SectionId = 'tool' | 'resource';
export type Section = { id: SectionId; label: string; icon: IconName; pages: NavPage[] };

export const TOOL_PAGES: ToolPageDef[] = [
  {
    path: '/outils/motif',
    label: 'Motif',
    icon: 'circle-dashed',
    engine: 'motif',
    pending: 'Le moteur de motifs arrive avec la partie pattern-engine.',
    editorSections: [
      { title: 'Préréglages partagés', open: true },
      { title: 'Circulation' }, // absente du Figma : tous ses réglages sont avancés, elle n'apparaît qu'avec eux
      { title: 'Réseau' },
      { title: 'Volume', open: true },
      { title: 'Pastilles', open: true },
      { title: 'Survol' },
      { title: 'Rotation' },
      { title: 'Couleurs' },
    ],
  },
  {
    path: '/outils/illustration',
    label: 'Illustration',
    icon: 'circles-three',
    pending: 'Les illustrations arrivent avec la partie pattern-engine.',
    editorSections: [
      { title: 'Préréglages partagés', open: true },
      { title: 'Images', open: true },
      { title: 'Animation' },
      { title: 'Lumière et tons de l’image', open: true },
      { title: 'Pastilles', open: true },
      { title: 'Survol' },
      { title: 'Rotation' },
      { title: 'Couleurs' },
    ],
  },
  {
    path: '/outils/layout-editor',
    label: 'Layout editor',
    icon: 'bezier',
    pending: 'Le Layout editor arrive avec la partie layout-editor.',
    editorSections: [
      { title: 'Layout', open: true },
      { title: 'Format' },
      { title: 'Calques', open: true },
      { title: 'Fill' },
      { title: 'Pastilles' },
      { title: 'Survol' },
      { title: 'Rotation' },
      { title: 'Couleurs' },
    ],
  },
];

export const RESOURCE_PAGES: ResourcePageDef[] = [
  {
    path: '/ressources/logo',
    label: 'Logo',
    icon: 'vector-logo',
    description: 'Les logos de la marque, prêts à télécharger.',
  },
  {
    path: '/ressources/typographie',
    label: 'Typographie',
    icon: 'text1',
    description: 'Les polices de la marque, leurs graisses et leur hiérarchie.',
  },
  {
    path: '/ressources/couleur',
    label: 'Couleur',
    icon: 'color-palette',
    description: 'La palette de la marque et ses valeurs à copier.',
  },
  {
    path: '/ressources/iconographie',
    label: 'Iconographie',
    icon: 'shapes-plus-x-square-circle',
    description: 'Les icônes de la marque, à rechercher et à copier.',
  },
  {
    path: '/ressources/imagerie',
    label: 'Imagerie',
    icon: 'images1',
    description: 'Les images et la direction photo de la marque.',
  },
  {
    path: '/ressources/patterns',
    label: 'Patterns prédéfinis',
    icon: 'dot-grid3x3',
    description: 'Les motifs prêts à l’emploi, générés avec l’outil.',
  },
  {
    path: '/ressources/inspiration',
    label: 'Inspiration',
    icon: 'lightbulb-glow',
    description: 'Les références visuelles qui nourrissent la marque.',
  },
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
