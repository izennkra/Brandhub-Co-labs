import { describe, expect, it } from 'vitest';
import { EDITOR_HEADER } from '../api/_lib/editor';
import { cleanName, handleFiles, MAX_FILE, type FileStore } from '../api/files';
import { handleStore, memoryDb } from '../api/store';

const CODE = 'colabs-2026';
const req = (path: string, init: RequestInit & { code?: string } = {}) => {
  const headers = new Headers(init.headers);
  if (init.code !== undefined) headers.set(EDITOR_HEADER, init.code);
  return new Request(`http://localhost${path}`, { ...init, headers });
};
const post = (body: unknown, code?: string) =>
  req('/api/store', { method: 'POST', body: JSON.stringify(body), code });

describe('/api/store : les Ressources demandent le code éditeur', () => {
  it('vérifie le code sans rien modifier', async () => {
    const check = (code?: string) => handleStore(req('/api/store?editor=1', { code }), memoryDb(), CODE);
    expect(await (await check(CODE)).json()).toEqual({ ok: true, valid: true });
    expect(await (await check('mauvais')).json()).toEqual({ ok: true, valid: false });
    expect(await (await check()).json()).toEqual({ ok: true, valid: false });
  });

  it('refuse d’écrire ou de supprimer une ressource sans le bon code', async () => {
    const db = memoryDb();
    const doc = { col: 'res-colors', id: 'brun', data: { name: 'Brun', hex: '#431604' } };
    expect((await handleStore(post(doc), db, CODE)).status).toBe(403);
    expect((await handleStore(post(doc, 'mauvais'), db, CODE)).status).toBe(403);
    expect((await handleStore(post(doc, CODE), db, CODE)).status).toBe(200);
    const remove = (code?: string) =>
      handleStore(req('/api/store?col=res-colors&id=brun', { method: 'DELETE', code }), db, CODE);
    expect((await remove('mauvais')).status).toBe(403);
    expect((await db.all('res-colors')).brun).toBeTruthy();
    expect((await remove(CODE)).status).toBe(200);
  });

  it('personne ne modifie les ressources tant qu’aucun code n’est réglé', async () => {
    const doc = { col: 'res-colors', id: 'a', data: {} };
    expect((await handleStore(post(doc, ''), memoryDb(), undefined)).status).toBe(403);
  });

  it('les préréglages du moteur restent ouverts à tous', async () => {
    const response = await handleStore(
      post({ col: 'presets', id: 'a', data: { name: 'A' } }),
      memoryDb(),
      CODE,
    );
    expect(response.status).toBe(200);
  });
});

describe('/api/files (Vercel Blob)', () => {
  function fakeBlob() {
    const saved = new Map<string, number>();
    const store: FileStore = {
      async put(pathname, body) {
        const url = `https://abc.public.blob.vercel-storage.com/${pathname}`;
        saved.set(url, body.byteLength);
        return { url };
      },
      async del(url) {
        saved.delete(url);
      },
    };
    return { store, saved };
  }
  const upload = (name: string, bytes: number, code = CODE) =>
    req(`/api/files?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      body: new Uint8Array(bytes),
      headers: { 'Content-Type': 'image/svg+xml' },
      code,
    });

  it('range un fichier et renvoie son adresse, puis le supprime', async () => {
    const { store, saved } = fakeBlob();
    const response = await handleFiles(upload('Logo Noir.SVG', 120), store, CODE);
    const { ok, url } = await response.json();
    expect(ok).toBe(true);
    expect(url).toBe('https://abc.public.blob.vercel-storage.com/ressources/logo-noir.svg');
    expect(saved.get(url)).toBe(120);
    const remove = req(`/api/files?url=${encodeURIComponent(url)}`, { method: 'DELETE', code: CODE });
    expect((await handleFiles(remove, store, CODE)).status).toBe(200);
    expect(saved.size).toBe(0);
  });

  it('refuse sans code, les types inconnus, les fichiers vides ou trop lourds, les adresses étrangères', async () => {
    const { store } = fakeBlob();
    const statuses = [
      await handleFiles(upload('logo.svg', 10, 'mauvais'), store, CODE),
      await handleFiles(upload('script.js', 10), store, CODE),
      await handleFiles(upload('vide.png', 0), store, CODE),
      await handleFiles(upload('lourd.png', MAX_FILE + 1), store, CODE),
      await handleFiles(
        req('/api/files?url=https://exemple.com/a.png', { method: 'DELETE', code: CODE }),
        store,
        CODE,
      ),
    ].map((r) => r.status);
    expect(statuses).toEqual([403, 400, 400, 413, 400]);
  });

  it('se déclare absent sans stockage Blob', async () => {
    expect((await handleFiles(upload('logo.svg', 10), null, CODE)).status).toBe(503);
  });

  it('nettoie les noms de fichiers', () => {
    expect(cleanName('Été — Logo (2).PNG')).toBe('ete-logo-2.png');
    expect(cleanName('***')).toBe('fichier');
  });
});
