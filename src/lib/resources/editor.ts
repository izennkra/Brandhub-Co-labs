import { useSyncExternalStore } from 'react';
import { getStore } from '../store/store';

// Mode édition des Ressources : déverrouillé par le code, le temps de l'onglet du navigateur.
const KEY = 'bhc.editorCode';
const listeners = new Set<() => void>();
let unlocked = false;

function setCode(code: string | null) {
  getStore().setEditorCode(code);
  unlocked = code !== null;
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    // stockage indisponible : le mode édition vaut pour cette page seulement
  }
  listeners.forEach((listener) => listener());
}

/** Reprend le code gardé dans l'onglet (rechargement de la page). */
export function restoreEditor() {
  try {
    const code = sessionStorage.getItem(KEY);
    if (code && !unlocked) setCode(code);
  } catch {
    // rien à reprendre
  }
}

/** Déverrouille si le code est le bon. */
export async function unlockEditor(code: string) {
  const ok = await getStore().checkCode(code.trim());
  if (ok) setCode(code.trim());
  return ok;
}

export function lockEditor() {
  setCode(null);
}

export function useEditor() {
  const isUnlocked = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => unlocked,
  );
  return { unlocked: isUnlocked, unlock: unlockEditor, lock: lockEditor };
}
