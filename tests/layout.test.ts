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
  it('démarre en 9:16, 1080 × 1920, sans calque, nommé « Visuel »', () => {
    const { doc } = layoutStore;
    expect([doc.name, doc.w, doc.h, formatName(doc), doc.layers.length]).toEqual([
      'Visuel',
      1080,
      1920,
      '9:16',
      0,
    ]);
  });

  it('le recul de la caméra reste dans la limite du moteur (180)', () => {
    const layer = newPatternLayer('image', { app: 'image' });
    layer.cam = { theta: 0, phi: Math.PI / 2, radius: 150, tx: 0, ty: 0, tz: 0 };
    layoutStore.addLayer(layer);
    layoutStore.fit(layer.id, { x0: 0.2, x1: 0.8, y0: 0.2, y1: 0.8, k: 1.2, fov: 35 }, 'cover');
    expect((layer.cam as { radius: number }).radius).toBeLessThanOrEqual(180);
    expect(layer.zoom).toBeGreaterThanOrEqual(1);
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

  it('mode 3D : glisser tourne la caméra de la forme ; un calque image n’a pas de mode 3D', () => {
    const layer = newPatternLayer('motif', { app: 'motif' });
    layoutStore.addLayer(layer);
    layoutStore.set3d(true);
    expect(layoutStore.mode3d).toBe(true);
    layer.cam = { theta: 0, phi: 1.5, radius: 40, tx: 0, ty: 0, tz: 0 };
    layoutStore.orbit(layer.id, 100, 0);
    expect((layer.cam as { theta: number }).theta).toBeCloseTo(-0.7);
    layoutStore.scale(layer.id, 2);
    expect([layer.w, layer.h, layer.x, layer.y]).toEqual([2160, 3840, -540, -960]);
    layoutStore.addLayer(newImageLayer('Logo', 'data:,', 100, 100));
    expect(layoutStore.mode3d).toBe(false);
  });

  it('à l’ajout, le calque épouse sa forme et couvre le frame à bord perdu', () => {
    const layer = newPatternLayer('motif', { app: 'motif' });
    layer.cam = { theta: 0, phi: Math.PI / 2, radius: 40, tx: 0, ty: 0, tz: 0 };
    layoutStore.addLayer(layer);
    // forme deux fois plus large que haute, centrée, vue avec une caméra reculée de 2
    layoutStore.fit(layer.id, { x0: 0.1, x1: 0.9, y0: 0.3, y1: 0.7, k: 2, fov: 35 }, 'cover');
    expect(layer.w / layer.h).toBeCloseTo(2, 2);
    expect([layer.x, layer.y, layer.h]).toEqual([Math.round((1080 - layer.w) / 2), 0, 1920]);
    expect(layer.zoom).toBeGreaterThanOrEqual(1);
    expect(layer.camScale).toBeCloseTo(1.5); // recul : la forme peut tourner sans sortir de l'image
    expect(layer.ref).toBeCloseTo(2 * 1.5 * 900, 0);
    expect(layer._fit0).toBeDefined();
  });

  it('après une rotation 3D, la forme garde sa taille et sa place, le calque se réajuste', () => {
    const layer = newPatternLayer('motif', { app: 'motif' });
    Object.assign(layer, { cam: { theta: 0, phi: Math.PI / 2, radius: 40, tx: 0, ty: 0, tz: 0 }, zoom: 2 });
    layoutStore.addLayer(layer);
    // forme décalée vers la droite, deux fois moins large que le calque
    layoutStore.fit(layer.id, { x0: 0.5, x1: 0.7, y0: 0.4, y1: 0.6, k: 2, fov: 35 }, 'keep');
    const cam = layer.cam as { tx: number; tz: number };
    expect(cam.tx).toBeGreaterThan(0); // la caméra vise le centre de la forme
    expect(layer.h).toBe(Math.round(0.4 * 1.03 * 1920 * 2));
    expect(layer.x + layer.w / 2).toBeCloseTo(540 + 0.2 * 1920 * 2, -1);
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
