import type { Engine } from './createEngine';

// Chargement à la demande du moteur (Three.js compris), une seule fois pour toute l'appli :
// la scène, la barre de scène et le panneau partagent la même demande.
let pending: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  pending ??= import('./createEngine').then(({ getEngine }) => getEngine());
  pending.catch(() => (pending = null)); // un échec pourra être retenté
  return pending;
}
