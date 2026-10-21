import { useState } from 'react';
import { Icon } from '../Icon';
import { useArmedDelete } from './imageHooks';
import styles from './PresetList.module.css';

export type PresetItem = { id: string; name: string; detail: string };

// Section « Préréglages partagés » (prototype, lignes 2677 à 2745) : nom + Enregistrer, puis la liste
// (appliquer, étoile = ouvert au démarrage sur cet appareil, retrait en deux temps) et une note.
export function PresetList({
  presets,
  defaultId,
  note,
  onSave,
  onApply,
  onToggleDefault,
  onDelete,
}: {
  presets: PresetItem[];
  defaultId: string | null;
  note: string;
  onSave: (name: string) => Promise<boolean>;
  onApply: (id: string) => void;
  onToggleDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const remove = useArmedDelete((index) => onDelete(presets[index].id));
  const save = async () => {
    if (await onSave(name)) setName('');
  };

  return (
    <div className={styles.presets}>
      <div className={styles.save}>
        <input
          type="text"
          className={styles.input}
          maxLength={40}
          placeholder="Nom du préréglage"
          aria-label="Nom du préréglage"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void save();
            }
          }}
        />
        <button type="button" className={styles.button} onClick={() => void save()}>
          Enregistrer
        </button>
      </div>

      {presets.length === 0 ? (
        <p className={styles.empty}>
          Aucun préréglage pour l’instant. Règle l’outil, donne un nom, puis enregistre.
        </p>
      ) : (
        <ul className={styles.list} aria-label="Préréglages">
          {presets.map((preset, index) => {
            const isDefault = defaultId === preset.id;
            const armed = remove.armed === index;
            return (
              <li key={preset.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.name}
                  title={'Appliquer ' + preset.name}
                  onClick={() => onApply(preset.id)}
                >
                  <span className={styles.label}>{preset.name}</span>
                  <small className={styles.detail}>{preset.detail}</small>
                </button>
                <button
                  type="button"
                  className={styles.icon}
                  data-on={isDefault}
                  aria-pressed={isDefault}
                  aria-label={
                    (isDefault ? 'Ne plus ouvrir par défaut ' : 'Ouvrir par défaut avec ') + preset.name
                  }
                  title={
                    isDefault
                      ? 'Ouvert au démarrage (sur cet appareil)'
                      : 'Ouvrir au démarrage (sur cet appareil)'
                  }
                  onClick={() => onToggleDefault(preset.id)}
                >
                  <Icon name="star" size="sm" />
                </button>
                <button
                  type="button"
                  className={styles.icon}
                  data-armed={armed}
                  aria-label={
                    armed ? `Confirmer la suppression de ${preset.name}` : `Supprimer ${preset.name}`
                  }
                  title="Supprimer pour tout le monde"
                  onClick={() => remove.request(index)}
                >
                  {armed ? 'Supprimer ?' : <Icon name="cross-medium" size="xs" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.note}>{note}</p>
    </div>
  );
}
