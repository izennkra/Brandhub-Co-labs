import { useSyncExternalStore } from 'react';

// Seuil unique du projet : sous 1280 px, la colonne de gauche se replie (voir README).
// Les media queries CSS ne lisent pas les variables : la règle vit ici, côté code.
export const NARROW_SCREEN = '(max-width: 1279.98px)';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
