import type { PrototypeEngine } from './prototype-engine.js';

// Graine de la forme affichée, pour la reproduire à l'identique (préréglages, intégration sur un site).
// Le moteur tire chaque forme (buildLoop, ligne 520) avec son générateur « rng » : même graine et
// mêmes réglages donnent la même forme. Le moteur ne permet pas de relire sa graine : l'appli la tire
// elle-même juste avant de redessiner la forme, et la garde ici. Le moteur n'est pas modifié.
// Seule exception : une forme dessinée à la souris (ligne 1149), dont le moteur tire seul la graine ;
// la forme reste alors sans graine connue, jusqu'à la prochaine « Nouvelle forme ».
//
// Une graine est un nombre (générateur mulberry32 du moteur), ou un « tirage » écrit à l'avance :
// la suite des valeurs que le moteur lira pour dessiner la forme (famille de nœud, étirement,
// déformation, angle ; makeKnot, ligne 502). Il sert aux formes imitées d'une maquette.
export type Seed = number | number[];
export type ShapeSeed = ReturnType<typeof createShapeSeed>;

export const isSeed = (value: unknown): value is Seed =>
  typeof value === 'number' ||
  (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'number'));

export function createShapeSeed(core: Pick<PrototypeEngine, 'S' | 'mulberry32' | 'rng'>) {
  let seed: Seed | null = null;
  let path: unknown;
  // Tirage écrit : ses valeurs dans l'ordre, puis le générateur du moteur (graine 0) pour la suite.
  const scripted = (values: number[]) => {
    const rest = core.mulberry32(0);
    let i = 0;
    return () => (i < values.length ? values[i++] : rest());
  };
  return {
    /** Passe au moteur une graine (au hasard, ou celle d'un préréglage) avant de redessiner la forme. */
    use(next: Seed = (Math.random() * 1e9) | 0) {
      seed = next;
      path = core.S.loopPath;
      core.rng = typeof next === 'number' ? core.mulberry32(next) : scripted(next);
      return next;
    },
    /** Graine de la forme affichée ; null si elle n'est pas connue. */
    current() {
      return seed !== null && core.S.loopPath === path ? seed : null;
    },
  };
}
