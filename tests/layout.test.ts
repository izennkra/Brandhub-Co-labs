import { beforeEach, describe, expect, it } from 'vitest';
import {
  emptyDoc,
  formatName,
  layoutStore,
  newImageLayer,
  newPatternLayer,
  serialize,
} from '../src/lib/layout/doc';
import { formatOf } from '../src/lib/resources/formats';

// Modèle du Layout editor : un frame, ses calques, le format et l'enregistrement.
beforeEach(() => layoutStore.reset(emptyDoc()));

describe('Layout editor : le frame et ses calques', () => {
  it('démarre en 9:16, 1080 × 1920, sans calque', () => {
    const { doc } = layoutStore;
    expect([doc.w, doc.h, formatName(doc), doc.layers.length]).toEqual([1080, 1920, '9:16', 0]);
  });

  it('un motif remplit le frame et il le remplit encore après un changement de format', () => {
    layoutStore.addLayer(newPatternLayer('motif', { app: 'motif' }));
    layoutStore.setFormat('16:9');
    const [layer] = layoutStore.doc.layers;
    expect([layer.x, layer.y, layer.w, layer.h]).toEqual([0, 0, 1920, 1080]);
    expect(formatName(layoutStore.doc)).toBe('16:9');
    expect(layoutStore.selected).toBe(layer.id);
  });

  it('une image garde ses proportions quand le format change', () => {
    layoutStore.addLayer(newImageLayer('Logo', 'data:image/png;base64,', 1000, 500));
    const before = { ...layoutStore.doc.layers[0] };
    layoutStore.setFormat('1:1');
    const after = layoutStore.doc.layers[0];
    expect(after.w / after.h).toBeCloseTo(before.w / before.h, 1);
    expect(after.x + after.w / 2).toBeCloseTo(540, -1); // toujours centrée
  });

  it('aligne, réordonne, masque et retire un calque', () => {
    layoutStore.addLayer(newImageLayer('A', 'data:,', 200, 100));
    layoutStore.addLayer(newImageLayer('B', 'data:,', 200, 100));
    const [a, b] = layoutStore.doc.layers;
    layoutStore.align(a.id, 'right');
    layoutStore.align(a.id, 'bottom');
    expect([a.x + a.w, a.y + a.h]).toEqual([1080, 1920]);
    layoutStore.moveLayer(a.id, 1);
    expect(layoutStore.doc.layers.map((l) => l.name)).toEqual(['B', 'A']);
    layoutStore.updateLayer(b.id, { hidden: true });
    expect(layoutStore.layer(b.id)?.hidden).toBe(true);
    layoutStore.select(a.id);
    layoutStore.removeLayer(a.id);
    expect(layoutStore.doc.layers.map((l) => l.name)).toEqual(['B']);
    expect(layoutStore.selected).toBeNull();
  });

  it('enregistre le document sans l’état interne du moteur ni l’aperçu', () => {
    const layer = newPatternLayer('image', { app: 'image', dots: ['brun'] });
    Object.assign(layer, { eng: { nodes: [] }, dirty: true, _cv: {}, _acc: 1 });
    layoutStore.addLayer(layer);
    const saved = JSON.parse(serialize(layoutStore.doc));
    expect(Object.keys(saved.layers[0]).sort()).not.toEqual(
      expect.arrayContaining(['eng', 'dirty', '_cv', '_acc']),
    );
    expect(saved.layers[0]).toMatchObject({
      name: 'Illustration 1',
      app: 'image',
      settings: { dots: ['brun'] },
    });
  });

  it('reconnaît les formats connus, sinon « Libre »', () => {
    expect(formatOf(1080, 1350)).toBe('4:5');
    expect(formatOf(2480, 3508)).toBe('A4');
    expect(formatOf(1000, 700)).toBe('Libre');
  });
});
