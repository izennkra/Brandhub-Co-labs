import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { CONTROLS, isVisible, type Control } from '../src/lib/pattern-engine/controls';

// La table des réglages doit reprendre exactement l'interface du prototype.
// Ce test relit le prototype (sans l'exécuter) et en déduit, pour chaque réglage :
// clé, libellé, bornes, pas, format, section, sous-menu, effet, niveau et mode.
const ROOT = join(import.meta.dirname, '..');
const SOURCE = readFileSync(join(ROOT, 'reference', 'prototype.html'), 'utf8');
const LINES = SOURCE.split('\n');

function slice(fromLine: number, toText: string): string {
  const end = LINES.findIndex((line, i) => i > fromLine && line.includes(toText));
  return LINES.slice(fromLine, end).join('\n');
}
const ENGINE_SRC = slice(
  LINES.findIndex((line) => line.includes('Palette et associations (planche couleur)')) - 1,
  '/*  Interface ',
);
const UI_SRC = slice(
  LINES.findIndex((line) => line.startsWith('/*  Interface ')),
  '</script>',
);

const parse = (code: string) =>
  ts.createSourceFile('prototype.js', code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const ENGINE = parse(ENGINE_SRC);
const UI = parse(UI_SRC);

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}
const text = (node: ts.Node) => node.getText(UI);
const name = (node: ts.Node | undefined) => (node && ts.isIdentifier(node) ? node.text : undefined);
const str = (node: ts.Node | undefined) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
const MAXL = Number(/\bMAXL = (\d+)/.exec(ENGINE_SRC)![1]);
function num(node: ts.Node): number {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken)
    return -num(node.operand);
  if (name(node) === 'MAXL') return MAXL;
  throw new Error(`Nombre non reconnu : ${node.getText()}`);
}
function calledName(node: ts.Node): string | undefined {
  if (!ts.isCallExpression(node)) return undefined;
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return `${text(callee.expression)}.${callee.name.text}`;
  return undefined;
}

// ---------- Clés de l'objet S ----------
function settingKeys(): Set<string> {
  const keys = new Set<string>();
  const addLiteral = (node: ts.Node | undefined) => {
    if (node && ts.isObjectLiteralExpression(node))
      node.properties.forEach((p) => p.name && keys.add(p.name.getText(ENGINE)));
  };
  walk(ENGINE, (node) => {
    if (ts.isVariableDeclaration(node) && name(node.name) === 'VARIANTS' && node.initializer)
      (node.initializer as ts.ArrayLiteralExpression).elements.forEach(addLiteral);
    if (ts.isVariableDeclaration(node) && name(node.name) === 'S' && node.initializer)
      addLiteral((node.initializer as ts.CallExpression).arguments[0]);
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      name(node.left.expression) === 'S'
    )
      keys.add(node.left.name.text);
  });
  return keys;
}

// ---------- Ce que l'interface du prototype déclare ----------
type Found = {
  kind: Control['kind'];
  key: string;
  label: string;
  node: ts.Node; // l'appel qui crée le réglage
  parentBox: string; // conteneur dans lequel il est rangé
  min?: number;
  max?: number;
  step?: number;
  fmt?: string;
  options?: { label: string; value: number }[];
  handler?: string; // code exécuté après le changement
};

const groups = new Map<string, string>(); // variable → titre du groupe
const parentOf = new Map<string, string>(); // variable → variable qui la contient
const ariaLabel = new Map<string, string>(); // variable → aria-label de l'élément
const subOfBox = new Map<string, string>(); // conteneur → sous-menu
const subOfCall = new Map<ts.Node, string>(); // appel slider(…) → sous-menu
const variantsOf = new Map<string | ts.Node, number[]>(); // variantes où l'élément est visible
const found: Found[] = [];

const declarations = new Map<string, ts.Expression>();
walk(UI, (node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
    declarations.set(node.name.text, node.initializer);
});

function readSubWrap(call: ts.CallExpression) {
  const title = str(call.arguments[1])!;
  let nodes = call.arguments[2];
  if (ts.isIdentifier(nodes)) nodes = declarations.get(nodes.text)!;
  if (!ts.isArrayLiteralExpression(nodes)) return; // « Tracé de la ligne » : voir plus bas
  nodes.elements.forEach((el) => {
    if (ts.isIdentifier(el)) subOfBox.set(el.text, title);
    else subOfCall.set(el, title);
  });
}

function visibilityOf(call: ts.CallExpression) {
  const target = call.arguments[0];
  const key: string | ts.Node = name(target) ?? target;
  const fn = calledName(call);
  if (fn === 'onlyAiry.push') variantsOf.set(key, [0]);
  if (fn === 'onlyDense.push') variantsOf.set(key, [1]);
  if (fn === 'onlyFor')
    variantsOf.set(key, (call.arguments[1] as ts.ArrayLiteralExpression).elements.map(num));
}

// le code qui suit un interrupteur : « X.lastChild.querySelector('input').addEventListener('change', …) »
function toggleListener(call: ts.Node): string | undefined {
  const statement = call.parent;
  const block = statement.parent as ts.Block | ts.SourceFile;
  const next = block.statements[block.statements.indexOf(statement as ts.Statement) + 1];
  const t = next?.getText(UI) ?? '';
  if (!t.includes(".lastChild.querySelector('input').addEventListener('change',")) return undefined;
  return text(((next as ts.ExpressionStatement).expression as ts.CallExpression).arguments[1]);
}

// les sélecteurs construits à la main : « ['A','B'].map((o,i)=>{ … S.clé=i … wrap.appendChild(b) }) »
function readHandBuiltChoice(call: ts.CallExpression) {
  const list = (call.expression as ts.PropertyAccessExpression).expression as ts.ArrayLiteralExpression;
  const callback = call.arguments[0] as ts.ArrowFunction;
  const param = callback.parameters[0].name;
  const indexName = ts.isArrayBindingPattern(param)
    ? name((param.elements[1] as ts.BindingElement).name)
    : name(callback.parameters[1]?.name);
  let key: string | undefined, handler: string | undefined, wrap: string | undefined;
  walk(callback, (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      name(node.left.expression) === 'S' &&
      name(node.right) === indexName
    ) {
      key = node.left.name.text;
      handler = text(node.parent.parent);
    }
    const fn = calledName(node);
    if (fn?.endsWith('.appendChild') && name((node as ts.CallExpression).arguments[0]) === 'b')
      wrap = fn.split('.')[0];
  });
  if (!key || !wrap) return; // ex. Variante : appelle setVariant, retirée de l'interface
  const options = list.elements.map((el, i) =>
    ts.isArrayLiteralExpression(el)
      ? { label: str(el.elements[0])!, value: num(el.elements[1]) }
      : { label: str(el)!, value: i },
  );
  found.push({
    kind: 'choice',
    key,
    label: ariaLabel.get(wrap)!,
    node: call,
    parentBox: wrap,
    options,
    handler,
  });
}

walk(UI, (node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    if (calledName(node.initializer) === 'group')
      groups.set(node.name.text, str((node.initializer as ts.CallExpression).arguments[0])!);
    if (calledName(node.initializer) === 'el') {
      const attrs = (node.initializer as ts.CallExpression).arguments[1];
      if (attrs && ts.isObjectLiteralExpression(attrs))
        attrs.properties.forEach((p) => {
          if (ts.isPropertyAssignment(p) && str(p.name) === 'aria-label')
            ariaLabel.set((node.name as ts.Identifier).text, str(p.initializer)!);
        });
    }
  }
  if (!ts.isCallExpression(node)) return;
  const fn = calledName(node);
  const args = node.arguments;
  if (fn?.endsWith('.appendChild') || fn?.endsWith('.insertBefore')) {
    const child = name(args[0]);
    if (child && !parentOf.has(child)) parentOf.set(child, fn.split('.')[0]);
  }
  if (fn === 'subWrap') readSubWrap(node);
  if (fn === 'onlyFor' || fn === 'onlyAiry.push' || fn === 'onlyDense.push') visibilityOf(node);
  if (fn === 'slider')
    found.push({
      kind: 'slider',
      key: str(args[1])!,
      label: str(args[2])!,
      node,
      parentBox: name(args[0])!,
      min: num(args[3]),
      max: num(args[4]),
      step: num(args[5]),
      fmt: text(args[6]),
      handler: args[7] && text(args[7]),
    });
  if (fn === 'toggle')
    found.push({
      kind: 'toggle',
      key: str(args[1])!,
      label: str(args[2])!,
      node,
      parentBox: name(args[0])!,
      handler: toggleListener(node),
    });
  if (fn === 'seg')
    found.push({
      kind: 'choice',
      key: str(args[1])!,
      label: str(args[2])!,
      node,
      parentBox: name(args[0])!,
      options: (args[3] as ts.ArrayLiteralExpression).elements.map((el, i) => ({
        label: str(el)!,
        value: i,
      })),
    });
  if (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'map' &&
    ts.isArrayLiteralExpression(node.expression.expression)
  )
    readHandBuiltChoice(node);
});

// « Tracé de la ligne » : le sous-menu reprend tout ce qui suit son titre dans le bloc de la Ligne.
const TRACE_TITLE = UI_SRC.indexOf("text:'Tracé de la ligne'");

// Réglages listés par le prototype comme avancés (« ADV_SLIDERS », « ADV_SUBS », « ADV_GROUPS »).
function stringList(varName: string): string[] {
  return (declarations.get(varName) as ts.ArrayLiteralExpression).elements.map((el) => str(el)!);
}
const ADV_SLIDERS = stringList('ADV_SLIDERS');
const ADV_SUBS = stringList('ADV_SUBS');
const ADV_GROUPS = stringList('ADV_GROUPS');
// Décision de la spec (21/10/2026) : tracé de ligne et infographie vont dans « Réglage avancé ».
const SPEC_ADVANCED_SUBS = ['Infographie', 'Tracé de la ligne'];
// Le prototype ne garde que la variante Quantique (n° 2) : ce qui n'existe que pour les autres
// variantes n'est jamais affiché.
const QUANTIQUE = 2;

// Groupes propres à chaque mode (syncApp du prototype).
const titlesOf = (list: string) => list.split(',').map((v) => groups.get(v.trim())!);
const ILLUSTRATION_ONLY = titlesOf(/const IMG_GROUPS=\[([^\]]+)\]/.exec(UI_SRC)![1]);
const MOTIF_ONLY = titlesOf(/if \(img\) \[([^\]]+)\]\.forEach/.exec(UI_SRC)![1]);

// Export : prévu après pattern-engine (spec), ses réglages ne sont pas dans la table.
const OUT_OF_SCOPE_SECTIONS = ['Exporter'];

// Ce que faisait l'interface du prototype après le changement (voir ControlEffect).
function effectOf(handler: string | undefined): string | undefined {
  if (!handler) return undefined;
  if (/^\w+$/.test(handler)) return handler;
  if (handler.includes('buildLine(true)')) return 'buildLine';
  if (handler.includes('imgTime=0')) return 'restartLoop';
  if (handler.includes('STRUCT_PRESETS[i]')) return 'setStructure';
  if (handler.includes('S.shapeMode=i') && handler.includes('regenerate(); resetView();')) return 'setShape';
  if (handler.includes('lineLobes=[]')) return 'setLineMode';
  return undefined; // ne fait que mettre l'interface à jour
}

function describeFound(f: Found) {
  let box = f.parentBox;
  let sub = subOfCall.get(f.node);
  if (!sub && box === 'lineBox' && f.node.getStart(UI) > TRACE_TITLE) sub = 'Tracé de la ligne';
  const variants = [variantsOf.get(f.node)];
  while (!groups.has(box)) {
    sub ??= subOfBox.get(box);
    variants.push(variantsOf.get(box));
    box = parentOf.get(box)!;
    if (!box) throw new Error(`Section introuvable pour ${f.key}`);
  }
  variants.push(variantsOf.get(box));
  const section = groups.get(box)!;
  const hidden = variants.some((list) => list && !list.includes(QUANTIQUE));
  const advanced =
    (f.kind === 'slider' && ADV_SLIDERS.includes(f.label)) ||
    ADV_GROUPS.includes(section) ||
    (sub !== undefined && (ADV_SUBS.includes(sub) || SPEC_ADVANCED_SUBS.includes(sub)));
  return {
    kind: f.kind,
    key: f.key,
    label: f.label,
    section,
    sub,
    level: hidden ? 'hidden' : advanced ? 'advanced' : 'essential',
    mode: ILLUSTRATION_ONLY.includes(section)
      ? 'illustration'
      : MOTIF_ONLY.includes(section)
        ? 'motif'
        : 'both',
    effect: effectOf(f.handler),
    ...(f.kind === 'slider' && { min: f.min, max: f.max, step: f.step }),
    ...(f.kind === 'choice' && { options: f.options }),
  };
}

function describeControl(c: Control) {
  return {
    kind: c.kind,
    key: c.key,
    label: c.label,
    section: c.section,
    sub: c.sub,
    level: c.level,
    mode: c.mode,
    effect: c.effect,
    ...(c.kind === 'slider' && { min: c.min, max: c.max, step: c.step }),
    ...(c.kind === 'choice' && { options: c.options }),
  };
}

const prototypeControls = found.filter((f) => !OUT_OF_SCOPE_SECTIONS.includes(describeFound(f).section));

// Écarts voulus avec le prototype : refonte de la partie Ligne validée le 22/10/2026
// (taille de la forme visible d'office, « Forme de la ligne » et « Infographie » hors du réglage
// avancé, « Progression » en trois boutons au lieu d'un curseur aux valeurs en mots).
const ESSENTIAL = { level: 'essential' } as const;
const LINE_SHAPE = { sub: 'Forme de la ligne', level: 'essential' } as const;
const DEPARTURES: Record<string, Record<string, unknown>> = {
  tubeR: { sub: undefined, level: 'essential' },
  junction: ESSENTIAL,
  thin: ESSENTIAL,
  lineLen: LINE_SHAPE,
  lineFade: LINE_SHAPE,
  lineWave: { sub: 'Forme de la ligne' },
  lineLabels: ESSENTIAL,
  dataContrast: ESSENTIAL,
  procMin: ESSENTIAL,
  infoScale: ESSENTIAL,
  infoGap: ESSENTIAL,
  procCurve: {
    kind: 'choice',
    level: 'essential',
    options: [
      { label: 'au début', value: 0.75 },
      { label: 'partout', value: 1 },
      { label: 'à la fin', value: 1.3 },
    ],
  },
};
function expectedControl(f: Found) {
  const { min, max, step, ...rest } = describeFound(f) as ReturnType<typeof describeFound> & {
    min?: number;
    max?: number;
    step?: number;
  };
  const changes = DEPARTURES[f.key] ?? {};
  if (changes.kind === 'choice') return { ...rest, ...changes };
  return { ...rest, ...(min !== undefined && { min, max, step }), ...changes };
}
const byKey = <T extends { key: string }>(list: T[]) =>
  Object.fromEntries(list.map((item) => [item.key, item]));

// Valeurs à essayer pour comparer les formats : bornes, milieu, seuils courants, et une grille.
function samples(min: number, max: number, step: number): number[] {
  const snap = (v: number) => Number((Math.round((v - min) / step) * step + min).toFixed(6));
  const values = [min, max, snap(min + step), snap(max - step), snap((min + max) / 2)];
  for (let i = 0; i <= 20; i++) values.push(snap(min + ((max - min) * i) / 20));
  [0, 1, 60, 100].forEach((v) => v >= min && v <= max && values.push(v));
  return values;
}
const fx = (d: number) => (v: number) => v.toFixed(d);

describe('table des réglages : reprise du prototype', () => {
  it('le prototype est lu correctement (garde-fou du test lui-même)', () => {
    const all = (kind: Control['kind']) => found.filter((f) => f.kind === kind).length;
    expect(all('slider')).toBe(67);
    expect(all('toggle')).toBe(6);
    expect(all('choice')).toBe(6); // Répartition + 4 sélecteurs faits main + celui de l'export
    expect(groups.size).toBeGreaterThan(10);
  });

  it('chaque réglage du prototype (hors export) est dans la table, à l’identique', () => {
    expect(byKey(CONTROLS.map(describeControl))).toEqual(byKey(prototypeControls.map(expectedControl)));
  });

  it('65 curseurs, 5 interrupteurs et 6 sélecteurs, sans doublon', () => {
    const count = (kind: Control['kind']) => CONTROLS.filter((c) => c.kind === kind).length;
    expect(count('slider')).toBe(65);
    expect(count('toggle')).toBe(5);
    expect(count('choice')).toBe(6);
    expect(new Set(CONTROLS.map((c) => c.key)).size).toBe(CONTROLS.length);
  });

  it('chaque valeur s’affiche avec le format du prototype', () => {
    for (const f of prototypeControls) {
      if (f.kind !== 'slider' || DEPARTURES[f.key]?.kind) continue;
      const expected = new Function('fx', `return (${f.fmt});`)(fx) as (v: number) => string;
      const control = CONTROLS.find((c) => c.key === f.key);
      if (control?.kind !== 'slider') throw new Error(`Curseur absent de la table : ${f.key}`);
      for (const v of samples(f.min!, f.max!, f.step!))
        expect(`${f.key}(${v}) = ${control.format(v)}`).toBe(`${f.key}(${v}) = ${expected(v)}`);
    }
  });

  it('chaque clé existe dans les réglages S du moteur', () => {
    const keys = settingKeys();
    expect(keys.size).toBeGreaterThan(60);
    for (const c of CONTROLS) expect(keys, c.key).toContain(c.key);
  });

  it('les réglages visibles dans le Figma sont « essentiels »', () => {
    const FIGMA = {
      motif: ['Structure', 'Renflements', 'Taille'],
      illustration: [
        'Luminosité',
        'Contraste',
        'Seuil clairs',
        'Saturation des noirs',
        'Inverser les tons',
        'Taille',
      ],
    };
    for (const [mode, labels] of Object.entries(FIGMA))
      for (const label of labels) {
        const control = CONTROLS.find((c) => c.label === label && (c.mode === mode || c.mode === 'both'));
        expect(control?.level, `${mode} › ${label}`).toBe('essential');
      }
  });

  it('affiche les réglages selon l’état, comme le prototype (syncStruct, syncHov)', () => {
    const shown = (key: string, settings: Record<string, unknown>) =>
      isVisible(
        CONTROLS.find((c) => c.key === key)!,
        settings,
      );
    const membrane = { qStruct: 1, lineMode: 0, hoverMode: 0 };
    const ligne = { qStruct: 2, lineMode: 0, hoverMode: 0 };
    expect(shown('shapeMode', membrane)).toBe(true);
    expect(shown('shapeMode', ligne)).toBe(false);
    expect(shown('lineLen', membrane)).toBe(false);
    expect(shown('lobeContrast', ligne)).toBe(true);
    expect(shown('lobeContrast', { ...ligne, lineMode: 1 })).toBe(false);
    expect(shown('dataContrast', { ...ligne, lineMode: 1 })).toBe(true);
    expect(shown('infoGap', { ...ligne, lineMode: 2 })).toBe(true);
    expect(shown('hoverRadius', { ...membrane, hoverMode: 1 })).toBe(false);
    expect(shown('lobes', ligne)).toBe(true);
    // en Données et en Process, un renflement par valeur ou par étape : réglages sans effet cachés
    for (const key of ['lobes', 'lobeLen', 'pinchSpeed']) {
      expect(shown(key, { ...ligne, lineMode: 1 }), key).toBe(false);
      expect(shown(key, { ...ligne, lineMode: 2 }), key).toBe(false);
      expect(shown(key, membrane), key).toBe(true);
    }
  });
});
