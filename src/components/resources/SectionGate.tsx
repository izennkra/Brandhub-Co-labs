import type { ReactNode } from 'react';
import { useEditor } from '../../lib/resources/editor';
import { useSectionLocks } from '../../lib/resources/sectionLocks';
import { Empty } from './Section';

// Contenu d'une page Ressource : caché aux visiteurs si l'éditeur a verrouillé la section.
// Avec le code éditeur, tout reste visible. Rien ne s'affiche tant que les verrous ne sont pas lus.
export function SectionGate({ path, children }: { path: string; children: ReactNode }) {
  const { unlocked } = useEditor();
  const locks = useSectionLocks();
  if (unlocked) return children;
  if (!locks.loaded) return null;
  if (locks.isLocked(path)) return <Empty>Cette section est verrouillée pour le moment.</Empty>;
  return children;
}
