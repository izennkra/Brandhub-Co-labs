import PANTONE from 'pantone-colors';
import { hexToOklab, normalizeHex } from './colors';

// Pantone le plus proche d'un code HEX (table libre de 907 teintes Pantone « C », couché).
// C'est une approximation : la teinte exacte se valide sur un nuancier Pantone imprimé.
const TABLE = Object.entries(PANTONE as Record<string, string>).map(([code, hex]) => ({
  code,
  lab: hexToOklab(normalizeHex(hex)!),
}));

export function nearestPantone(hex: string) {
  const target = hexToOklab(hex);
  let best = TABLE[0];
  let bestDistance = Infinity;
  for (const entry of TABLE) {
    const d =
      (entry.lab[0] - target[0]) ** 2 + (entry.lab[1] - target[1]) ** 2 + (entry.lab[2] - target[2]) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = entry;
    }
  }
  return `Pantone ${best.code} C`;
}
