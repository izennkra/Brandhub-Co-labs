import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Règle n° 1 du projet : le moteur de patterns n'est jamais modifié.
// Ce test refait l'extraction de son côté (indépendamment du script) et compare.
const ROOT = join(import.meta.dirname, '..');
const PROTOTYPE = join(ROOT, 'reference', 'prototype.html');
const ENGINE = join(ROOT, 'src', 'lib', 'pattern-engine', 'prototype-engine.js');
const GLOBALS = join(ROOT, 'src', 'lib', 'pattern-engine', 'required-globals.json');

const BEGIN = '// ===== DÉBUT DU BLOC MOTEUR (identique au prototype, ne pas modifier) =====\n';
const END = '\n// ===== FIN DU BLOC MOTEUR =====';

function blockFromPrototype(): string {
  const lines = readFileSync(PROTOTYPE, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.includes('Palette et associations (planche couleur)')) - 1;
  const end = lines.findIndex((line) => line.startsWith('/*  Interface ')) - 1;
  const block = lines.slice(start, end);
  while (block.at(-1)?.trim() === '') block.pop();
  return block.join('\n');
}

function blockFromEngine(source: string): string {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start < 0 || end < 0) throw new Error('Marqueurs du bloc moteur introuvables');
  return source.slice(start + BEGIN.length, end);
}

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

describe('moteur de patterns : copie à l’identique', () => {
  it('le fichier généré existe', () => {
    expect(existsSync(ENGINE)).toBe(true);
  });

  it('le bloc du projet est identique octet pour octet à celui du prototype', () => {
    const fromPrototype = blockFromPrototype();
    expect(fromPrototype.startsWith('/* ----')).toBe(true);
    expect(fromPrototype.trimEnd().endsWith('}')).toBe(true);
    expect(blockFromEngine(readFileSync(ENGINE, 'utf8'))).toBe(fromPrototype);
  });

  it("l'empreinte SHA-256 notée dans l'en-tête correspond au bloc", () => {
    const source = readFileSync(ENGINE, 'utf8');
    expect(source).toContain(`SHA-256 du bloc : ${sha256(blockFromPrototype())}`);
  });

  it('chaque nom attendu par le bloc est reçu de la couche d’adaptation', () => {
    const names: string[] = JSON.parse(readFileSync(GLOBALS, 'utf8'));
    expect(names).toContain('THREE');
    const header = readFileSync(ENGINE, 'utf8').split(BEGIN)[0];
    for (const name of names) expect(header).toMatch(new RegExp(`\\b${name}\\b`));
  });
});
