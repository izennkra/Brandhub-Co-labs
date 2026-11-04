import type { PrototypeEngine } from './prototype-engine.js';

// Graine de la forme affichée, pour la reproduire à l'identique (préréglages, intégration sur un site).
// Le moteur tire chaque forme (buildLoop, ligne 520) avec son générateur « rng » : même graine et
// mêmes réglages donnent la même forme. Le moteur ne permet pas de relire sa graine : l'appli la tire
// elle-même juste avant de redessiner la forme, et la garde ici. Le moteur n'est pas modifié.
// Seule exception : une forme dessinée à la souris (ligne 1149), dont le moteur tire seul la graine ;
// la forme reste alors sans graine connue, jusqu'à la prochaine « Nouvelle forme ».
export type ShapeSeed = ReturnType<typeof createShapeSeed>;

export function createShapeSeed(core: Pick<PrototypeEngine, 'S' | 'mulberry32' | 'rng'>) {
  let seed: number | null = null;
  let path: unknown;
  return {
    /** Passe au moteur une graine (au hasard, ou celle d'un préréglage) avant de redessiner la forme. */
    use(next: number = (Math.random() * 1e9) | 0) {
      seed = next;
      path = core.S.loopPath;
      core.rng = core.mulberry32(next);
      return next;
    },
    /** Graine de la forme affichée ; null si elle n'est pas connue. */
    current() {
      return seed !== null && core.S.loopPath === path ? seed : null;
    },
  };
}
