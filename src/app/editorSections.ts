// Sections du panneau Éditeur de chaque page Tool, dans l'ordre du Figma (orthographe corrigée).
// « open » : section dépliée à l'arrivée, comme sur la maquette.
// Leur contenu (curseurs, choix…) arrive avec les parties pattern-engine et layout-editor.
export type EditorSection = { title: string; open?: boolean };

export const EDITOR_SECTIONS: Record<string, EditorSection[]> = {
  '/outils/motif': [
    { title: 'Préréglages partagés', open: true },
    { title: 'Réseau' },
    { title: 'Volume', open: true },
    { title: 'Pastilles', open: true },
    { title: 'Survol' },
    { title: 'Rotation' },
    { title: 'Couleurs' },
  ],
  '/outils/illustration': [
    { title: 'Préréglages partagés', open: true },
    { title: 'Images', open: true },
    { title: 'Animation' },
    { title: 'Lumière et tons de l’image', open: true },
    { title: 'Pastilles', open: true },
    { title: 'Survol' },
    { title: 'Rotation' },
    { title: 'Couleurs' },
  ],
  '/outils/layout-editor': [
    { title: 'Layout', open: true },
    { title: 'Format' },
    { title: 'Calques', open: true },
    { title: 'Fill' },
    { title: 'Pastilles' },
    { title: 'Survol' },
    { title: 'Rotation' },
    { title: 'Couleurs' },
  ],
};
