import type { IconName } from '../components/Icon';

// Modèle unique des pages : tout ce qui décrit une page (adresse, libellé, icône, contenu provisoire,
// sections de l'Éditeur) vit ici, au même endroit. Libellés repris du Figma, orthographe corrigée.
export type NavPage = { path: string; label: string; icon: IconName };

// Section du panneau Éditeur. « open » : dépliée à l'arrivée, comme sur la maquette.
export type EditorSection = { title: string; open?: boolean };

export type ToolPageDef = NavPage & {
  engine?: 'motif' | 'illustration'; // page affichant le moteur de patterns dans la zone centrale
  layout?: boolean; // Layout editor : un frame et ses calques, avec son propre panneau
  pending: string; // texte d'attente, tant que la page n'a pas son contenu
  editorSections: EditorSection[]; // dans l'ordre du Figma
};

export type ResourcePageDef = NavPage & {
  description: string; // provisoire, à remplacer par les textes définitifs
  editTips: string[]; // consignes du mode édition, dans le panneau latéral
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
    engine: 'illustration',
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
    layout: true,
    pending: 'Chargement du Layout editor…',
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
    editTips: [
      'Dépose chaque logo une seule fois, en SVG, dans sa section (Logo principal, Symbole…).',
      'Il est décliné tout seul dans chaque couleur de la page Couleur, et s’exporte en SVG, PNG et PDF.',
      '« Ajouter une section » pour une autre déclinaison ; clique sur un titre pour le renommer.',
    ],
  },
  {
    path: '/ressources/typographie',
    label: 'Typographie',
    icon: 'text1',
    description: 'Les polices de la marque, leurs graisses et leur hiérarchie.',
    editTips: [
      'Change le nom, le rôle, les graisses et le code CSS directement dans les cartes.',
      'Dépose les fichiers de police (WOFF2, OTF, TTF) dans la carte Fichiers.',
      'Ajoute ou retire des niveaux dans l’échelle typographique.',
    ],
  },
  {
    path: '/ressources/couleur',
    label: 'Couleur',
    icon: 'color-palette',
    description: 'La palette de la marque et ses valeurs à copier.',
    editTips: [
      'Palette principale, puis palette secondaire pour les couleurs d’accent : un nom et un code HEX suffisent.',
      'Neutres : saisis la couleur la plus claire et la plus foncée, les paliers se construisent seuls.',
      'Les nuances de chaque couleur sont calculées automatiquement.',
    ],
  },
  {
    path: '/ressources/iconographie',
    label: 'Iconographie',
    icon: 'shapes-plus-x-square-circle',
    description: 'Les icônes de la marque, à rechercher et à copier.',
    editTips: [
      'Les icônes viennent de la bibliothèque Central : il n’y a rien à déposer.',
      'Les couleurs de la page Couleur apparaissent en raccourci dans le filtre Couleur.',
    ],
  },
  {
    path: '/ressources/imagerie',
    label: 'Imagerie',
    icon: 'images1',
    description: 'Les images et la direction photo de la marque.',
    editTips: [
      'Dépose tes images dans la zone d’ajout.',
      'Donne un thème à chaque image : il sert de filtre.',
    ],
  },
  {
    path: '/ressources/patterns',
    label: 'Patterns prédéfinis',
    icon: 'dot-grid3x3',
    description: 'Les motifs prêts à l’emploi, générés avec l’outil.',
    editTips: ['Les layouts arrivent depuis le Layout editor ; ici, tu peux les renommer ou les retirer.'],
  },
  {
    path: '/ressources/inspiration',
    label: 'Inspiration',
    icon: 'lightbulb-glow',
    description: 'Les références visuelles qui nourrissent la marque.',
    editTips: [
      'Dépose tes images d’inspiration dans la zone d’ajout.',
      'Clique sur un nom pour le renommer.',
    ],
  },
  {
    path: '/ressources/qr-code',
    label: 'QR code',
    icon: 'qr-code',
    description: 'Des QR codes dans le style des illustrations.',
    editTips: [
      'Colle un lien, puis « Styliser dans l’Illustration » : le QR prend la trame et les réglages des icônes.',
      'Dans l’Illustration, « Enregistrer l’illustration » le garde pour tous.',
    ],
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
