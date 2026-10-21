import type { IconName } from '../components/Icon';

// Pages listées dans la colonne de gauche. Les libellés reprennent ceux du Figma.
export type NavPage = { path: string; label: string; icon: IconName };

export const TOOL_PAGES: NavPage[] = [
  { path: '/outils/motif', label: 'Motif', icon: 'circle-dashed' },
  { path: '/outils/illustrations', label: 'Illustrations iconographique', icon: 'circles-three' },
  { path: '/outils/layout-editor', label: 'Layout editor', icon: 'bezier' },
];
