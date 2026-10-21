import { useId } from 'react';
import { Icon } from '../Icon';
import { useArmedDelete, useReorder, type ImageItem } from './imageHooks';
import styles from './ImageStrip.module.css';

// Bandeau de vignettes sous la scène de l'Illustration (Figma ; prototype renderThumbs, ligne 2866) :
// choisir, retirer (en deux temps), glisser pour réordonner, cocher la boucle, « + » pour importer.
export function ImageStrip({
  images,
  loop,
  onPick,
  onMove,
  onDelete,
  onToggleLoop,
  onAdd,
}: {
  images: ImageItem[];
  loop: boolean;
  onPick: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (index: number) => void;
  onToggleLoop: (index: number) => void;
  onAdd: (files: File[]) => void;
}) {
  const remove = useArmedDelete(onDelete);
  const reorder = useReorder(onMove);
  const inputId = useId();

  return (
    <div className={styles.strip} role="group" aria-label="Bande d’images">
      {images.map((image, index) => (
        <div
          key={`${index}-${image.name}`}
          className={styles.tile}
          data-selected={image.selected}
          title={image.name}
          {...reorder(index)}
        >
          <button
            type="button"
            className={styles.pick}
            aria-label={`Afficher ${image.name}`}
            aria-current={image.selected}
            onClick={() => onPick(index)}
          >
            <img src={image.thumb} alt="" />
          </button>
          <button
            type="button"
            className={styles.delete}
            data-armed={remove.armed === index}
            aria-label={
              remove.armed === index ? `Confirmer la suppression de ${image.name}` : `Supprimer ${image.name}`
            }
            onClick={() => remove.request(index)}
          >
            {remove.armed === index ? '?' : <Icon name="cross-medium" size="xs" />}
          </button>
          {loop && (
            <button
              type="button"
              className={styles.loop}
              aria-pressed={image.inLoop}
              aria-label={`Inclure ${image.name} dans la boucle`}
              onClick={() => onToggleLoop(index)}
            >
              {image.inLoop && <Icon name="checkmark1-small" size="xs" />}
            </button>
          )}
        </div>
      ))}
      <span className={styles.separator} aria-hidden="true" />
      <label className={styles.add} htmlFor={inputId} title="Importer des images">
        <Icon name="plus-large" size="md" />
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className={styles.input}
        aria-label="Importer des images"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length) onAdd(files);
        }}
      />
    </div>
  );
}
