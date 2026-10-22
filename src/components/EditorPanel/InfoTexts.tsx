import { useState } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import {
  hasInfoTexts,
  readData,
  readStepRows,
  writeData,
  writeStepRows,
} from '../../lib/pattern-engine/infoTexts';
import { Icon } from '../Icon';
import styles from './InfoTexts.module.css';

// Textes de l'infographie du Motif (mode Ligne), comme dans le prototype (lignes 2975-3040) :
// - Process : un titre libre et un texte par étape (2 à 10), ajout et suppression, titre par défaut ;
// - Données : une valeur et un texte par donnée (1 à 16), unité affichée.
// Tout reste rangé en texte dans les réglages du moteur (procTexts, lineData…), donc dans les préréglages.

const PROC_MAX = 10;
const DATA_MAX = 16;
const pad = (k: number) => String(k + 1).padStart(2, '0');

export function InfoTexts({ engine }: { engine: Engine }) {
  const S = engine.core.S;
  // valeur en cours de frappe (« 12. » avant « 12.5 ») : gardée telle quelle jusqu'à la sortie du champ
  const [draft, setDraft] = useState<{ row: number; text: string } | null>(null);
  if (!hasInfoTexts(S)) return null;

  if (Number(S.lineMode) === 2) {
    const steps = readStepRows(S);
    const label = String(S.procLabel ?? '').trim() || 'Étape';
    // un nouveau nombre d'étapes refait les renflements (setInfo)
    const write = (next: { title: string; text: string }[]) => engine.actions.setInfo(writeStepRows(next));
    const edit = (k: number, change: Partial<{ title: string; text: string }>) =>
      write(steps.map((step, i) => (i === k ? { ...step, ...change } : step)));
    return (
      <div className={styles.box}>
        <p className={styles.hint}>Un renflement par étape, de gauche à droite.</p>
        {steps.map((step, k) => (
          <fieldset key={k} className={styles.row}>
            <legend className={styles.head}>
              <span>Étape {k + 1}</span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Supprimer l’étape ${k + 1}`}
                disabled={steps.length <= 2}
                onClick={() => write(steps.filter((_, i) => i !== k))}
              >
                <Icon name="cross-medium" size="xs" />
              </button>
            </legend>
            <input
              className={styles.input}
              maxLength={40}
              aria-label={`Titre de l’étape ${k + 1}`}
              placeholder={`${label} ${pad(k)}`}
              value={step.title}
              onChange={(event) => edit(k, { title: event.target.value })}
            />
            <textarea
              className={styles.input}
              rows={2}
              aria-label={`Texte de l’étape ${k + 1}`}
              placeholder="Texte de l’étape"
              value={step.text}
              onChange={(event) => edit(k, { text: event.target.value })}
            />
          </fieldset>
        ))}
        <button
          type="button"
          className={styles.add}
          disabled={steps.length >= PROC_MAX}
          onClick={() => write([...steps, { title: '', text: 'Lorem ipsum dolor sit amet.' }])}
        >
          + Ajouter une étape
        </button>
        <label className={styles.field}>
          <span>Titre par défaut, numéroté</span>
          <input
            className={styles.input}
            maxLength={24}
            placeholder="Étape"
            value={String(S.procLabel ?? '')}
            onChange={(event) => engine.actions.setInfo({ procLabel: event.target.value })}
          />
        </label>
      </div>
    );
  }

  const rows = readData(S.lineData, S.lineTexts);
  const unit = String(S.lineUnit ?? '');
  const write = (next: { value: string; text: string }[]) => {
    engine.actions.setInfo(writeData(next));
    if (next.length !== rows.length) setDraft(null);
  };
  return (
    <div className={styles.box}>
      {rows.map((row, k) => (
        <div key={k} className={styles.row}>
          <div className={styles.head}>
            <span>Donnée {pad(k)}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Supprimer la donnée ${k + 1}`}
              disabled={rows.length <= 1}
              onClick={() => write(rows.filter((_, i) => i !== k))}
            >
              <Icon name="cross-medium" size="xs" />
            </button>
          </div>
          <div className={styles.data}>
            <span className={styles.number}>
              <input
                className={styles.input}
                inputMode="decimal"
                aria-label={`Valeur de la donnée ${k + 1}`}
                value={draft?.row === k ? draft.text : row.value}
                onChange={(event) => {
                  const value = (event.target.value.match(/-?\d+(?:[.,]\d+)?/) ?? [''])[0].replace(',', '.');
                  setDraft({ row: k, text: event.target.value });
                  write(rows.map((r, i) => (i === k ? { ...r, value } : r)));
                }}
                onBlur={() => setDraft(null)}
              />
              {unit && <span aria-hidden="true">{unit}</span>}
            </span>
            <input
              className={styles.input}
              aria-label={`Texte de la donnée ${k + 1}`}
              placeholder="Texte"
              value={row.text}
              onChange={(event) =>
                write(rows.map((r, i) => (i === k ? { ...r, text: event.target.value } : r)))
              }
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={styles.add}
        disabled={rows.length >= DATA_MAX}
        onClick={() => write([...rows, { value: '50', text: 'Lorem Ipsum' }])}
      >
        + Ajouter une donnée
      </button>
      <label className={styles.field}>
        <span>Unité affichée</span>
        <input
          className={styles.input}
          maxLength={8}
          placeholder="%"
          value={unit}
          onChange={(event) => engine.actions.setInfo({ lineUnit: event.target.value })}
        />
      </label>
    </div>
  );
}
