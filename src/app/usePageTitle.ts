import { useEffect } from 'react';

// Titre de l'onglet du navigateur, propre à chaque page (utile aux lecteurs d'écran et à l'historique).
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Brand Hub · Co-labs`;
  }, [title]);
}
