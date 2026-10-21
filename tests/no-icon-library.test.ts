import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Règle du projet : icônes VisualSystem (set Central) uniquement, copiées une par une
// dans src/components/icons.registry.tsx. Aucune librairie d'icônes installée.
const ICON_LIBRARY = /icon|lucide|heroicons|phosphor|feather|fontawesome|tabler|remixicon|ionicons/i;

describe('icônes', () => {
  it("n'installe aucune librairie d'icônes", () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((name) => ICON_LIBRARY.test(name))).toEqual([]);
  });
});
