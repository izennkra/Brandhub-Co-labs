// Choix du bloc Export. Fichier léger : le panneau l'importe sans charger le moteur ni Three.js.

// Tailles du bloc Export du Figma : multiples de la scène affichée (le prototype proposait HD, 2K, 4K, 6K).
export const EXPORT_SCALES = [1, 2, 3, 4, 6] as const;
// EXPORT_FMTS (ligne 3216).
export const EXPORT_FMTS = [
  ['PNG', 'png', 'image/png'],
  ['WebP', 'webp', 'image/webp'],
  ['JPEG', 'jpg', 'image/jpeg'],
] as const;
export const EXPORT_TABS = ['Image', 'SVG', 'Vidéo', 'Figma'] as const;
