// Extrait le moteur de patterns de reference/prototype.html, octet pour octet,
// et génère src/lib/pattern-engine/prototype-engine.js (voir SPEC-pattern-engine.md).
// Le bloc n'est jamais modifié : seules l'en-tête (noms reçus) et la fin (API renvoyée) sont générées.
// Usage : npm run engine:extract
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const ROOT = join(import.meta.dirname, '..');
const PROTOTYPE = join(ROOT, 'reference', 'prototype.html');
const OUT_DIR = join(ROOT, 'src', 'lib', 'pattern-engine');

// Ce que la couche d'adaptation lit dans le moteur. Ajouter un nom ici, puis relancer le script.
const EXPORTS = [
  'S',
  'canvas',
  'renderer',
  'regenerate',
  'refreshColors',
  'resetView',
  'resize',
  'frame',
  'MEMBRANE_BASE',
  'mulberry32',
  'loadLibrary',
  'isLine',
  'buildLine',
  'PALETTE',
  'IMG_KEYS',
  'IMAGE_DEFAULTS',
  'motifStash',
  'imageStash',
  'worldR',
  'imgList',
  'demoImages',
  'addImages',
  'showImage',
  'saveImageMeta',
  'Store',
  'TONE_KEYS',
  'toneFromS',
  'curImg',
  'selImg',
  'orbit',
  'storeReady',
];

// Variables du bloc que la couche d'adaptation doit pouvoir réaffecter, comme le faisait
// l'interface du prototype (ex. « rng = mulberry32(…) » avant une nouvelle forme).
const SETTERS = [
  'rng',
  'lineLobes',
  'motifStash',
  'imageStash',
  'worldR',
  'imgTime',
  'imgDirty',
  'imgList',
  'curImg',
  'selImg',
  'imgTr',
];

// Fonctions du navigateur que la couche d'adaptation remplace pour le bloc (sans toucher au bloc) :
// requestAnimationFrame permet de mettre la boucle en pause hors des pages Tool.
const SHADOWED = ['requestAnimationFrame'];

const BEGIN = '// ===== DÉBUT DU BLOC MOTEUR (identique au prototype, ne pas modifier) =====';
const END = '// ===== FIN DU BLOC MOTEUR =====';

function findBlock(lines) {
  const palette = lines.findIndex((line) => line.includes('Palette et associations (planche couleur)'));
  const iface = lines.findIndex((line) => line.startsWith('/*  Interface '));
  if (palette < 1 || iface < palette)
    throw new Error('Repères du bloc moteur introuvables dans le prototype');
  const start = palette - 1; // ligne « /* ---- » au-dessus du titre
  let end = iface - 1; // ligne « /* ---- » au-dessus de « Interface »
  while (lines[end - 1].trim() === '') end--;
  return { start, end, text: lines.slice(start, end).join('\n') };
}

// Noms utilisés par le bloc sans y être définis : ceux que le reste du prototype fournissait.
function findFreeNames(block) {
  const fileName = '/probe.js';
  const code = `function probe() {\n${block}\n}\n`;
  const options = {
    allowJs: true,
    checkJs: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2023.d.ts', 'lib.dom.d.ts'],
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (name, version, ...rest) =>
    name === fileName
      ? ts.createSourceFile(name, code, version, true, ts.ScriptKind.JS)
      : getSourceFile(name, version, ...rest);
  host.fileExists = (name) => name === fileName || fileExists(name);
  host.readFile = (name) => (name === fileName ? code : readFile(name));
  const program = ts.createProgram([fileName], options, host);
  const names = new Set();
  for (const diagnostic of program.getSemanticDiagnostics(program.getSourceFile(fileName))) {
    if (![2304, 2552, 2582].includes(diagnostic.code)) continue; // « Cannot find name … »
    const match = ts
      .flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      .match(/Cannot find name '([^']+)'/);
    if (match) names.add(match[1]);
  }
  return [...names].sort();
}

// Noms déclarés au premier niveau du bloc (const, let, function), y compris « let a = 1, b = 2 ».
function declaredNames(block) {
  const source = ts.createSourceFile('/block.js', block, ts.ScriptTarget.ES2022, false, ts.ScriptKind.JS);
  const names = new Set();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) names.add(statement.name.text);
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
  }
  return names;
}

function generate() {
  const lines = readFileSync(PROTOTYPE, 'utf8').split('\n');
  const block = findBlock(lines);
  const sha = createHash('sha256').update(block.text, 'utf8').digest('hex');
  const names = [...new Set([...findFreeNames(block.text), ...SHADOWED])].sort();
  const declared = declaredNames(block.text);
  for (const name of [...EXPORTS, ...SETTERS]) {
    if (!declared.has(name)) {
      throw new Error(`« ${name} » n'est pas défini dans le bloc moteur`);
    }
  }

  const source = [
    '// GÉNÉRÉ par scripts/extract-engine.mjs — NE PAS MODIFIER À LA MAIN (npm run engine:extract).',
    `// Bloc moteur copié octet pour octet depuis reference/prototype.html, lignes ${block.start + 1} à ${block.end}.`,
    `// SHA-256 du bloc : ${sha}`,
    '/* eslint-disable */',
    '// @ts-nocheck',
    'export function runPrototypeEngine(env) {',
    '  // Noms que le reste du prototype (ou le navigateur) fournissait ; ils viennent de la couche d’adaptation.',
    `  let { ${names.join(', ')} } = env;`,
    BEGIN,
    block.text,
    END,
    `  return { ${[
      ...EXPORTS.map((name) => `get ${name}() { return ${name}; }`),
      ...SETTERS.map((name) => `set ${name}(value) { ${name} = value; }`),
    ].join(', ')} };`,
    '}',
    '',
  ].join('\n');

  writeFileSync(join(OUT_DIR, 'prototype-engine.js'), source);
  writeFileSync(join(OUT_DIR, 'required-globals.json'), JSON.stringify(names, null, 2) + '\n');
  console.log(`Bloc moteur : lignes ${block.start + 1}–${block.end}, ${block.text.length} caractères`);
  console.log(`SHA-256 : ${sha}`);
  console.log(`Noms à fournir (${names.length}) : ${names.join(', ')}`);
}

generate();
