import { createContext, useContext, useEffect, useRef } from 'react';

// Bouton orange « Tout télécharger » des pages Ressource : chaque page lui confie son action.
export type DownloadAll = { label: string; run: () => Promise<void> } | null;

export const DownloadAllContext = createContext<(action: DownloadAll) => void>(() => {});

/** Déclare l'action du bouton pour la page affichée (null : rien à télécharger). */
export function useDownloadAll(label: string, run: (() => Promise<void>) | null) {
  const set = useContext(DownloadAllContext);
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  const available = run !== null;
  useEffect(() => {
    set(available ? { label, run: () => latest.current?.() ?? Promise.resolve() } : null);
    return () => set(null);
  }, [set, label, available]);
}
