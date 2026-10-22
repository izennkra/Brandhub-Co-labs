import { useState } from 'react';
import { Icon } from '../Icon';
import { useArmedDelete, useReorder, type ImageItem } from './imageHooks';
import styles from './ImageList.module.css';

// Section « Images » du panneau Illustration (Figma) : poignée, nom, crayon, croix ; image choisie encadrée.
// Au clavier, la poignée déplace l'image avec les flèches haut et bas.
// Renommer : crayon ou double-clic sur le nom ; Entrée ou clic ailleurs valide, Échap annule.
// Dessous : « Enregistrer l'illustration » (pour tous, avec ses réglages) et une note.
export function ImageList({
  images,
  onPick,
  onMove,
  onDelete,
  onRename,
  save,
}: {
  images: ImageItem[];
  onPick: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  onRename?: (index: number, name: string) => void;
  save?: { label: string; note: string; onSave: () => Promise<void> };
}) {
  const remove = useArmedDelete(onDelete);
  const reorder = useReorder(onMove);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const finish = (index: number, name: string | null) => {
    setEditing(null);
    if (name !== null) onRename?.(index, name);
  };

  return (
    <>
      <ul className={styles.list} aria-label="Images">
        {images.map((image, index) => (
          <li
            key={`${index}-${image.name}`}
            className={styles.row}
            data-selected={image.selected}
            {...reorder(index)}
          >
            <button
              type="button"
              className={styles.handle}
              aria-label={`Déplacer ${image.name}`}
              title="Glisser, ou flèches haut et bas"
              onKeyDown={(event) => {
                const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1;
                if (to < 0 || to >= images.length) return;
                event.preventDefault();
                onMove(index, to);
              }}
            >
              <Icon name="dot-grid2x3" size="sm" />
            </button>
            {editing === index ? (
              <input
                className={styles.rename}
                aria-label={`Nouveau nom de ${image.name}`}
                defaultValue={image.name}
                maxLength={80}
                autoFocus
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => finish(index, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                  if (event.key === 'Escape') finish(index, null);
                }}
              />
            ) : (
              <button
                type="button"
                className={styles.name}
                aria-current={image.selected}
                title={image.name}
                onClick={() => onPick(index)}
                onDoubleClick={() => onRename && setEditing(index)}
              >
                {image.name}
                {image.saved === false && <span className={styles.tag}> · non enregistrée</span>}
              </button>
            )}
            {onRename && editing !== index && (
              <button
                type="button"
                className={styles.delete}
                aria-label={`Renommer ${image.name}`}
                title="Renommer"
                onClick={() => setEditing(index)}
              >
                <Icon name="pencil" size="xs" />
              </button>
            )}
            <button
              type="button"
              className={styles.delete}
              data-armed={remove.armed === index}
              aria-label={
                remove.armed === index
                  ? `Confirmer la suppression de ${image.name}`
                  : `Supprimer ${image.name}`
              }
              onClick={() => remove.request(index)}
            >
              {remove.armed === index ? 'Supprimer ?' : <Icon name="cross-medium" size="xs" />}
            </button>
          </li>
        ))}
      </ul>
      {save && (
        <div className={styles.save}>
          <button
            type="button"
            className={styles.saveButton}
            disabled={busy || images.length === 0}
            onClick={async () => {
              setBusy(true);
              await save.onSave();
              setBusy(false);
            }}
          >
            {busy ? 'Enregistrement…' : save.label}
          </button>
          <p className={styles.note}>{save.note}</p>
        </div>
      )}
    </>
  );
}
