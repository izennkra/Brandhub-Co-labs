import { describe, expect, it } from 'vitest';
import { handleStore, MAX_BODY, memoryDb, type StoreDb } from '../api/store';
import { createStore } from '../src/lib/store/store';

const call = (db: StoreDb | null, path: string, init?: RequestInit) =>
  handleStore(new Request(`http://localhost${path}`, init), db);
const post = (db: StoreDb, body: unknown) =>
  call(db, '/api/store', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

// Stockage du navigateur simulé (localStorage).
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}

describe('/api/store (contrat imposé par le Store du moteur)', () => {
  it('répond au ping quand une base est configurée', async () => {
    expect(await (await call(memoryDb(), '/api/store?ping=1')).json()).toEqual({ ok: true });
  });

  it('se déclare absent sans base : le moteur reste alors dans le navigateur', async () => {
    const response = await call(null, '/api/store?ping=1');
    expect(response.ok).toBe(false);
    expect((await response.json()).ok).toBe(false);
  });

  it('enregistre, liste, lit, met à jour et supprime un document', async () => {
    const db = memoryDb();
    expect(
      await (await post(db, { col: 'presets', id: 'doux', data: { name: 'Doux', t: 1 } })).json(),
    ).toEqual({
      ok: true,
    });
    await post(db, { col: 'presets', id: 'vif', data: { name: 'Vif', t: 2 } });
    await post(db, { col: 'presets', id: 'doux', data: { name: 'Doux 2', t: 3 } });

    const list = await (await call(db, '/api/store?col=presets')).json();
    expect(list).toEqual({
      ok: true,
      items: [
        { id: 'doux', data: { name: 'Doux 2', t: 3 } },
        { id: 'vif', data: { name: 'Vif', t: 2 } },
      ],
    });
    expect(await (await call(db, '/api/store?col=presets&id=vif')).json()).toEqual({
      ok: true,
      item: { data: { name: 'Vif', t: 2 } },
    });

    await call(db, '/api/store?col=presets&id=vif', { method: 'DELETE' });
    expect(await (await call(db, '/api/store?col=presets&id=vif')).json()).toEqual({ ok: true, item: null });
    expect((await (await call(db, '/api/store?col=presets')).json()).items).toHaveLength(1);
  });

  it('garde les collections séparées', async () => {
    const db = memoryDb();
    await post(db, { col: 'images', id: 'a', data: { name: 'A' } });
    expect((await (await call(db, '/api/store?col=imagesrc')).json()).items).toEqual([]);
  });

  it('refuse les requêtes mal formées avec { ok: false, error }', async () => {
    const db = memoryDb();
    const cases = [
      await call(db, '/api/store?col=../secret'),
      await call(db, '/api/store'),
      await post(db, '{pas du json'),
      await post(db, { col: 'presets', id: '', data: {} }),
      await post(db, { col: 'presets', id: 'x'.repeat(201), data: {} }),
      await post(db, { col: 'presets', id: 'a' }),
      await call(db, '/api/store?col=presets', { method: 'DELETE' }),
      await call(db, '/api/store', { method: 'PUT', body: '{}' }),
    ];
    for (const response of cases) {
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect((await response.json()).ok).toBe(false);
    }
    expect((await (await call(db, '/api/store?col=presets')).json()).items).toEqual([]);
  });

  it('refuse un document trop lourd (limite Vercel)', async () => {
    const response = await post(memoryDb(), { col: 'imagesrc', id: 'a', data: 'x'.repeat(MAX_BODY) });
    expect(response.status).toBe(413);
  });

  it('signale une panne de la base sans la laisser remonter', async () => {
    const broken: StoreDb = { ...memoryDb(), all: () => Promise.reject(new Error('panne')) };
    const original = console.error;
    console.error = () => {};
    const response = await call(broken, '/api/store?col=presets');
    console.error = original;
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'erreur du stockage' });
  });
});

describe('module de stockage de l’appli', () => {
  it('passe par le service partagé quand il répond', async () => {
    const db = memoryDb();
    const store = createStore({
      fetch: (input, init) => call(db, input, init),
      storage: fakeStorage(),
    });
    await store.ready;
    expect(store.kind).toBe('api');
    await store.put('logos', 'principal', { name: 'Logo' });
    expect(await store.get('logos', 'principal')).toEqual({ name: 'Logo' });
    expect(await store.list('logos')).toEqual([{ id: 'principal', data: { name: 'Logo' } }]);
    await store.del('logos', 'principal');
    expect(await store.list('logos')).toEqual([]);
  });

  it('remonte l’erreur du service quand l’enregistrement est refusé', async () => {
    const store = createStore({
      fetch: (input, init) => call(memoryDb(), input, init),
      storage: fakeStorage(),
    });
    await expect(store.put('../x', 'a', {})).rejects.toThrow('collection invalide');
  });

  it('reste dans le navigateur sans service, avec les mêmes clés que le moteur', async () => {
    const storage = fakeStorage();
    // Préréglage écrit par le moteur (Store._lwrite) : le module le retrouve.
    storage.setItem('bhc.store.presets', JSON.stringify({ doux: { name: 'Doux' } }));
    const store = createStore({ fetch: () => Promise.reject(new Error('hors ligne')), storage });
    await store.ready;
    expect(store.kind).toBe('local');
    expect(await store.list('presets')).toEqual([{ id: 'doux', data: { name: 'Doux' } }]);

    await store.put('presets', 'vif', { name: 'Vif' });
    expect(JSON.parse(storage.getItem('bhc.store.presets')!)).toEqual({
      doux: { name: 'Doux' },
      vif: { name: 'Vif' },
    });
    await store.del('presets', 'doux');
    expect(await store.get('presets', 'doux')).toBeNull();
    expect(await store.get('presets', 'vif')).toEqual({ name: 'Vif' });
  });

  it('reste dans le navigateur quand le service se déclare absent', async () => {
    const store = createStore({ fetch: (input, init) => call(null, input, init), storage: fakeStorage() });
    await store.ready;
    expect(store.kind).toBe('local');
  });

  it('signale un navigateur plein', async () => {
    const storage = fakeStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const store = createStore({ fetch: () => Promise.reject(new Error('hors ligne')), storage });
    await expect(store.put('presets', 'a', {})).rejects.toMatchObject({ code: 'quota' });
  });
});
