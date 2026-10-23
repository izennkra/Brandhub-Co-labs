import { useCollection } from './useCollection';

// Sections Ressource verrouillées par l'éditeur : un document par section, rangé sous la fin de son adresse.
// Collection « res- » : le stockage partagé n'accepte les changements qu'avec le code éditeur.
// Pour les visiteurs, une section verrouillée garde son nom (avec un cadenas) mais cache son contenu.
export const LOCKS_COLLECTION = 'res-locked';
type Lock = { path: string };

const lockId = (path: string) => path.split('/').pop() || path;

export function useSectionLocks() {
  const locks = useCollection<Lock>(LOCKS_COLLECTION);
  const locked = new Set(locks.items.map((lock) => lock.path));
  return {
    loaded: locks.loaded,
    isLocked: (path: string) => locked.has(path),
    setLocked: (path: string, label: string, on: boolean) =>
      on
        ? locks.set(lockId(path), { path }, `« ${label} » est verrouillée pour les visiteurs.`)
        : locks.remove(lockId(path), `« ${label} » est de nouveau ouverte à tous.`),
  };
}
