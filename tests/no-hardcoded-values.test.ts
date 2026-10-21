import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Garde-fou du design system : les couleurs n'existent que dans src/styles/tokens.css
// (voir docs/design-tokens.md). Partout ailleurs, on utilise var(--color-…).
const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const TOKENS = join(SRC, 'styles', 'tokens.css');
// Seule exception : le calcul des valeurs d'une couleur saisie sur la page Couleur (RVB, TSL).
const COLOR_MATH = join(SRC, 'lib', 'resources', 'colors.ts');

const COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;

export function findHardcodedColors(content: string): string[] {
  return content.match(COLOR_PATTERN) ?? [];
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('findHardcodedColors', () => {
  it('repère les couleurs hexadécimales et les fonctions de couleur', () => {
    expect(findHardcodedColors('color: #431604; background: #fff;')).toEqual(['#431604', '#fff']);
    expect(findHardcodedColors('border-color: rgb(67 22 4 / 0.1)')).toEqual(['rgb(']);
    expect(findHardcodedColors('fill: hsla(0, 0%, 0%, 0.5)')).toEqual(['hsla(']);
  });

  it('ignore les variables et les sélecteurs ordinaires', () => {
    expect(findHardcodedColors('color: var(--color-text); #root { margin: 0 }')).toEqual([]);
  });
});

describe('design system', () => {
  it("n'a aucune couleur en dur hors de tokens.css", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => file !== TOKENS && file !== COLOR_MATH)
      .flatMap((file) =>
        findHardcodedColors(readFileSync(file, 'utf8')).map((color) => `${relative(ROOT, file)} : ${color}`),
      );
    expect(offenders).toEqual([]);
  });

  it('définit les tokens validés dans tokens.css', () => {
    const tokens = readFileSync(TOKENS, 'utf8');
    const required = [
      '--color-bg',
      '--color-surface',
      '--color-text',
      '--color-text-secondary',
      '--color-accent',
      '--color-focus',
      '--font-sans',
      '--text-sm',
      '--space-4',
      '--radius-md',
      '--size-control',
      '--icon-sm',
    ];
    expect(required.filter((name) => !tokens.includes(`${name}:`))).toEqual([]);
  });
});
