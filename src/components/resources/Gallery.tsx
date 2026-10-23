import { useRef, useState } from 'react';
import { downloadFile, imageFileName } from '../../lib/resources/download';
import { useEditor } from '../../lib/resources/editor';
import { notify } from '../../lib/resources/events';
import { imageSize, removeResourceFile, saveResourceFile } from '../../lib/resources/files';
import { useCollection, type Entry } from '../../lib/resources/useCollection';
import { Icon } from '../Icon';
import { DeleteButton } from './DeleteButton';
import { DropZone } from './DropZone';
import { EditableText } from './EditableText';
import styles from './resources.module.css';
import { Empty } from './Section';

// Mosaïque d'images (Figma « Ressource / Inspiration ») : 4 colonnes, un clic agrandit l'image.
// Sert aussi à l'Imagerie (filtre par thème) et aux Patterns prédéfinis (filtre par format).
export type GalleryImage = { name: string; url: string; width: number; height: number; tag?: string };

export function Gallery({
  collection,
  tagLabel,
  tags,
  emptyText,
  canAdd = true,
}: {
  collection: string;
  /** Nom du filtre (« Thème », « Format ») ; sans lui, pas de filtre. */
  tagLabel?: string;
  /** Valeurs proposées d'office pour le filtre (ex. les formats). */
  tags?: string[];
  emptyText: string;
  /** Ajout d'images depuis la page (les layouts, eux, viennent du Layout editor). */
  canAdd?: boolean;
}) {
  const { unlocked } = useEditor();
  const images = useCollection<GalleryImage>(collection);
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<Entry<GalleryImage> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const allTags = [
    ...new Set([...(tags ?? []), ...images.items.map((i) => i.tag).filter(Boolean)]),
  ] as string[];
  const shown = filter ? images.items.filter((i) => i.tag === filter) : images.items;
  const download = (image: GalleryImage) => downloadFile(image.url, imageFileName(image));

  const addImages = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        notify(`« ${file.name} » n’est pas une image.`);
        continue;
      }
      try {
        const url = await saveResourceFile(file);
        const { width, height } = await imageSize(url);
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        await images.add(
          { name, url, width, height, ...(filter ? { tag: filter } : {}) },
          `Image ajoutée : ${name}`,
        );
      } catch {
        notify(`Impossible d’ajouter « ${file.name} ».`);
      }
    }
  };

  const show = (image: Entry<GalleryImage>) => {
    setOpen(image);
    dialog.current?.showModal?.();
  };

  if (!images.loaded) return null;

  return (
    <>
      {tagLabel && allTags.length > 0 && (
        <div className={styles.chips} role="group" aria-label={`Filtrer par ${tagLabel.toLowerCase()}`}>
          {[null, ...allTags].map((tag) => (
            <button
              key={tag ?? 'tout'}
              type="button"
              className={styles.light}
              aria-pressed={filter === tag}
              onClick={() => setFilter(tag)}
            >
              {tag ?? 'Tout'}
            </button>
          ))}
        </div>
      )}

      {unlocked && canAdd && (
        <DropZone
          accept="image/*"
          label={`Dépose tes images ici, ou clique pour les choisir${filter ? ` (thème « ${filter} »)` : ''}`}
          onFiles={(files) => void addImages(files)}
        />
      )}

      {shown.length === 0 ? (
        <Empty>{filter ? 'Aucune image pour ce filtre.' : emptyText}</Empty>
      ) : (
        <div className={styles.masonry}>
          {shown.map((image) => (
            <div key={image.id}>
              <button
                type="button"
                className={styles.tile}
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
                aria-label={`Agrandir ${image.name}`}
                onClick={() => show(image)}
              >
                <img src={image.url} alt="" loading="lazy" width={image.width} height={image.height} />
              </button>
              {unlocked && (
                <div className={styles.tileBar}>
                  <EditableText
                    value={image.name}
                    label="Nom de l’image"
                    editing
                    onSave={(name) => images.update(image.id, { name })}
                  />
                  {tagLabel && (
                    <EditableText
                      value={image.tag ?? ''}
                      label={tagLabel}
                      editing
                      onSave={(tag) => images.update(image.id, { tag: tag || undefined })}
                    />
                  )}
                  <DeleteButton
                    name={image.name}
                    onDelete={async () => {
                      await images.remove(image.id, `Image supprimée : ${image.name}`);
                      void removeResourceFile(image.url);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <dialog
        ref={dialog}
        className={styles.lightbox}
        aria-label={open?.name ?? 'Image'}
        onClose={() => setOpen(null)}
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      >
        {open && (
          <>
            <img src={open.url} alt={open.name} />
            <div className={styles.lightboxBar}>
              <span>
                {open.name}
                {open.tag ? ` · ${open.tag}` : ''}
              </span>
              <span className={styles.cardActions}>
                <button type="button" className={styles.light} onClick={() => void download(open)}>
                  Télécharger <Icon name="arrow-inbox" size="sm" />
                </button>
                <button type="button" className={styles.light} onClick={() => dialog.current?.close()}>
                  Fermer <Icon name="cross-medium" size="xs" />
                </button>
              </span>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
