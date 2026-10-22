import { useRef } from 'react';
import { layoutStore, newImageLayer, newPatternLayer } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { readAsDataUrl } from '../../lib/resources/files';
import { Icon } from '../Icon';
import styles from './LayoutPanel.module.css';

const MAX_SIDE = 2000; // côté le plus long d'une image gardée dans le layout (prototype, ligne 3664)

// Image déposée : réduite, PNG si elle a de la transparence possible, JPEG sinon.
async function loadImage(file: File) {
  const src = await readAsDataUrl(file);
  const img = new Image();
  img.src = src;
  await img.decode();
  const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const alpha = file.type === 'image/png' || file.type === 'image/webp';
  return { src: c.toDataURL(alpha ? 'image/png' : 'image/jpeg', 0.9), width: c.width, height: c.height };
}

/** Ajouter un calque : le motif ou l'illustration de l'outil (tels que réglés), ou une image. */
export function AddLayerButtons({ engine }: { engine: Engine | null }) {
  const input = useRef<HTMLInputElement>(null);
  // La forme arrive sur fond transparent, fondue dans le fond du frame, et son calque l'épouse,
  // posé à bord perdu dans le frame.
  const addPattern = (app: 'motif' | 'image') => {
    if (!engine) return;
    const settings = engine.layout.baseSettings(app);
    if (layoutStore.doc.fill) settings.bg = layoutStore.doc.fill;
    const layer = newPatternLayer(app, settings);
    layoutStore.addLayer(layer);
    const shape = engine.layout.measure(layer, true);
    if (shape) layoutStore.fit(layer.id, shape, 'cover');
  };
  const addImages = async (files: FileList) => {
    for (const file of [...files].filter((f) => f.type.startsWith('image/'))) {
      try {
        const { src, width, height } = await loadImage(file);
        layoutStore.addLayer(newImageLayer(file.name.replace(/\.[^.]+$/, ''), src, width, height));
      } catch {
        engine?.events.dispatchEvent(new CustomEvent('toast', { detail: `Image illisible : ${file.name}` }));
      }
    }
  };
  return (
    <div className={styles.addRow}>
      <button type="button" className={styles.add} disabled={!engine} onClick={() => addPattern('motif')}>
        <Icon name="circle-dashed" size="sm" /> Motif
      </button>
      <button type="button" className={styles.add} disabled={!engine} onClick={() => addPattern('image')}>
        <Icon name="circles-three" size="sm" /> Illustration
      </button>
      <button type="button" className={styles.add} onClick={() => input.current?.click()}>
        <Icon name="images1" size="sm" /> Image
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label="Ajouter une image au layout"
        onChange={(event) => {
          if (event.target.files?.length) void addImages(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
