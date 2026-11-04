import { describe, expect, it } from 'vitest';
import { isTransparent, readAxes, readFormat } from '../src/embed/core/attributes';
import { getStore, openStore, seedStore } from '../src/embed/core/memoryStore';

// Parties communes des scripts d'intégration : attributs partagés et stockage en mémoire.
const read = (attrs: Record<string, string>) => (name: string) => attrs[name] ?? null;

describe('attributs communs : fond transparent, format, axes', () => {
  it('fond transparent : reconnu', () => {
    expect(isTransparent(read({ fond: 'Transparent' }))).toBe(true);
    expect(isTransparent(read({ fond: 'lin' }))).toBe(false);
  });

  it('format : 16/9, 1:1, 4x5 → aspect-ratio CSS ; le reste est ignoré', () => {
    expect(readFormat('16/9')).toBe('16 / 9');
    expect(readFormat(' 1:1 ')).toBe('1 / 1');
    expect(readFormat('4x5')).toBe('4 / 5');
    expect(readFormat('2,35/1')).toBe('2.35 / 1');
    expect(readFormat('carré')).toBeNull();
    expect(readFormat('0/9')).toBeNull();
    expect(readFormat(null)).toBeNull();
  });

  it('axes en degrés → radians, 0 par défaut, bornés à ±360', () => {
    const [x, y, z] = readAxes(read({ 'axe-x': '90', 'axe-z': '-45' }));
    expect(x).toBeCloseTo(Math.PI / 2);
    expect(y).toBe(0);
    expect(z).toBeCloseTo(-Math.PI / 4);
    expect(readAxes(read({ 'axe-y': '999' }))[1]).toBeCloseTo(2 * Math.PI);
  });
});

describe('stockage en mémoire', () => {
  it('lecture après ouverture, écritures gardées en mémoire', async () => {
    seedStore({ images: { a: { name: 'A' } } });
    const store = getStore();
    let read = false;
    const listed = store.list('images').then((items) => ((read = true), items));
    await Promise.resolve();
    expect(read).toBe(false); // pas encore ouvert : la bibliothèque attend
    openStore();
    expect(await listed).toEqual([{ id: 'a', data: { name: 'A' } }]);
    await store.put('images', 'b', { name: 'B' });
    expect(await store.get('images', 'b')).toEqual({ name: 'B' });
    await store.del('images', 'a');
    expect(await store.get('images', 'a')).toBeNull();
    expect(localStorage.length).toBe(0); // rien d'écrit chez le visiteur
  });
});
