// Textes de l'infographie du Motif (mode Ligne) : lecture des réglages du moteur, rangés en texte
// comme dans le prototype (readProc, readData, lignes 2980-3014).

/** L'infographie a des textes : mode Ligne, en Données ou en Process. */
export const hasInfoTexts = (S: Record<string, unknown>) => S.qStruct === 2 && Number(S.lineMode) >= 1;

/** Textes des étapes (au moins 2), un par ligne de procTexts. */
export const readSteps = (texts: unknown, steps: unknown) => {
  const list = String(texts ?? '').split('\n');
  const n = Math.max(2, Number(steps) | 0);
  while (list.length < n) list.push('');
  return list.slice(0, n);
};

/** Données : valeurs de lineData et textes de lineTexts, rangés par paires. */
export const readData = (data: unknown, texts: unknown) => {
  const values = (String(data ?? '').match(/-?\d+(?:[.,]\d+)?/g) ?? []).map((v) => v.replace(',', '.'));
  const lines = String(texts ?? '').split('\n');
  return values.map((value, k) => ({ value, text: lines[k] ?? '' }));
};

/** Réglages à écrire pour une liste d'étapes. */
export const writeSteps = (steps: string[]) => ({
  procSteps: steps.length,
  procTexts: steps.map((t) => t.replace(/\n/g, ' ')).join('\n'),
});

/** Réglages à écrire pour une liste de données (une valeur vide compte 0). */
export const writeData = (rows: { value: string; text: string }[]) => ({
  lineData: rows.map((row) => row.value || '0').join(', '),
  lineTexts: rows.map((row) => row.text.replace(/\n/g, ' ')).join('\n'),
});

/** Étapes : titre libre (procTitles, vide = « Étape 01 ») et texte (procTexts), au moins deux. */
export const readStepRows = (S: Record<string, unknown>) => {
  const texts = readSteps(S.procTexts, S.procSteps);
  const titles = String(S.procTitles ?? '').split('\n');
  return texts.map((text, k) => ({ title: titles[k] ?? '', text }));
};

/** Réglages à écrire pour une liste d'étapes (titres et textes). */
export const writeStepRows = (rows: { title: string; text: string }[]) => ({
  ...writeSteps(rows.map((row) => row.text)),
  procTitles: rows.map((row) => row.title.replace(/\n/g, ' ')).join('\n'),
});
