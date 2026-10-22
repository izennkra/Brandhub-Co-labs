import { beforeEach, describe, expect, it } from 'vitest';
import {
  emptyDoc,
  formatName,
  layoutStore,
  newImageLayer,
  newPatternLayer,
  type PatternLayer,
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

  it('manipulation 3D : tourne la caméra du motif, zoome dedans (100 à 800 %) et recentre', () => {
    const layer = newPatternLayer('motif', { app: 'motif' });
    layoutStore.addLayer(layer);
    layoutStore.set3d(true);
    expect(layoutStore.mode3d).toBe(true);
    // le moteur a dessiné le calque une première fois : sa caméra existe
    layer.cam = { theta: 0, phi: 1.5, radius: 40 };
    layer._cam0 = { theta: 0, phi: 1.5, radius: 40 };
    layoutStore.orbit(layer.id, 100, 0);
    expect((layer.cam as { theta: number }).theta).toBeCloseTo(-0.7);
    layoutStore.zoomInto(layer.id, 0.25, 0, 100);
    expect(layer.zoom).toBe(8); // plafonné à 800 %
    expect(Math.abs(layer.pan![0])).toBeLessThanOrEqual(0.5 - 0.5 / 8);
    layoutStore.recenter(layer.id);
    expect([layer.zoom, layer.pan, (layer.cam as { theta: number }).theta]).toEqual([1, [0, 0], 0]);
    // un calque image ne se manipule pas en 3D
    layoutStore.addLayer(newImageLayer('Logo', 'data:,', 100, 100));
    expect(layoutStore.mode3d).toBe(false);
  });

  it('un motif garde sa largeur de référence : agrandi, il grandit d’un bloc', () => {
    layoutStore.addLayer(newPatternLayer('motif', { app: 'motif' }));
    const layer = layoutStore.doc.layers[0] as PatternLayer;
    layoutStore.updateLayer(layer.id, { w: 2160, h: 3840 });
    expect([layer.ref, layer.w]).toEqual([1080, 2160]);
  });

  it('chaque visite repart d’un frame vide : rien n’est enregistré', () => {
    layoutStore.addLayer(newPatternLayer('image', { app: 'image' }));
    expect(localStorage.length).toBe(0);
  });

  it('reconnaît les formats connus, sinon « Libre »', () => {
    expect(formatOf(1080, 1350)).toBe('4:5');
    expect(formatOf(2480, 3508)).toBe('A4');
    expect(formatOf(1000, 700)).toBe('Libre');
  });
});
