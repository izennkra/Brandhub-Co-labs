import { useState } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { hasInfoTexts, readData, readSteps, writeData, writeSteps } from '../../lib/pattern-engine/infoTexts';
import { Icon } from '../Icon';
import styles from './InfoTexts.module.css';

// Textes de l'infographie du Motif (mode Ligne), comme dans le prototype (lignes 2975-3040) :
// - Process : un texte par étape (2 à 10), ajout et suppression d'étapes, nom des étapes ;
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
    const steps = readSteps(S.procTexts, S.procSteps);
    const label = String(S.procLabel ?? '').trim() || 'Étape';
    // un nouveau nombre d'étapes refait les renflements (setInfo)
    const write = (next: string[]) => engine.actions.setInfo(writeSteps(next));
    return (
      <div className={styles.box}>
        {steps.map((text, k) => (
          <div key={k} className={styles.row}>
            <div className={styles.head}>
              <span>
                {label} {pad(k)}
              </span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Supprimer l’étape ${k + 1}`}
                disabled={steps.length <= 2}
                onClick={() => write(steps.filter((_, i) => i !== k))}
              >
                <Icon name="cross-medium" size="xs" />
              </button>
            </div>
            <textarea
              className={styles.input}
              rows={2}
              aria-label={`Texte de l’étape ${k + 1}`}
              placeholder="Texte de l’étape"
              value={text}
              onChange={(event) => write(steps.map((t, i) => (i === k ? event.target.value : t)))}
            />
          </div>
        ))}
        <button
          type="button"
          className={styles.add}
          disabled={steps.length >= PROC_MAX}
          onClick={() => write([...steps, 'Lorem ipsum dolor sit amet.'])}
        >
          + Ajouter une étape
        </button>
        <label className={styles.field}>
          <span>Nom des étapes</span>
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
