import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleStore, memoryDb, type StoreDb } from '../api/store';
import { createLibrary } from '../src/lib/pattern-engine/library';
import type { PrototypeEngine } from '../src/lib/pattern-engine/prototype-engine.js';
import { createStore } from '../src/lib/store/store';

const CODE = 'colabs-2026';
const canvas = { toDataURL: () => 'data:image/jpeg;base64,AAA' } as unknown as HTMLCanvasElement;
type Img = {
  id?: string;
  name: string;
  canvas: HTMLCanvasElement;
  tone?: Record<string, unknown>;
  src?: string;
};

// Moteur simulé : réglages, liste d'images, et le Store du moteur (qui écrivait tout pour tout le monde).
function setup({ library = [] as Img[], editor = false } = {}) {
  const db: StoreDb = memoryDb();
  const store = createStore({
    fetch: (input, init) => handleStore(new Request(`http://localhost${input}`, init), db, CODE),
    storage: null,
  });
  if (editor) store.setEditorCode(CODE);
  const engineWrites: string[] = [];
  const core = {
    S: { app: 'image', imgCols: 40, bg: 'taupe', imgLoop: true, imgBright: 0 } as Record<string, unknown>,
    TONE_KEYS: ['imgBright'],
    imgList: [] as Img[],
    selImg: 0,
    curImg: 0,
    imgTr: null,
    imgDirty: false,
    Store: {
      kind: 'api',
      put: vi.fn(async (...[col, id]: [string, string, unknown?]) => void engineWrites.push(`${col}/${id}`)),
      list: async () => [],
      del: async () => {},
    },
    // loadLibrary du moteur : bibliothèque vide → il y range les images de départ.
    async loadLibrary() {
      core.imgList = library.length
        ? library.map((im) => ({ ...im, canvas, tone: { ...im.tone } }))
        : [{ id: 'depart', name: 'Départ', canvas, src: 'data:,depart', tone: { imgBright: 0 } }];
      if (!library.length) await core.Store.put('images', 'depart', {});
    },
    showImage(k: number) {
      core.selImg = k;
    },
  };
  const toasts: string[] = [];
  const lib = createLibrary(core as unknown as PrototypeEngine, store, {
    snapshot: () => ({ ...core.S }),
    apply: (settings) => Object.assign(core.S, settings),
    loadTone: (k) => (core.S.imgBright = core.imgList[k]?.tone?.imgBright ?? 0),
    isEditor: () => editor,
    toast: (m) => toasts.push(m),
    changed: () => {},
  });
  return { db, core, lib, toasts, engineWrites };
}

async function withSaved(editor = false) {
  const first = setup();
  const db = first.db;
  await db.set('images', 'cadenas', { name: 'Cadenas', tone: { imgBright: 5 }, t: 1 });
  await db.set('imagesrc', 'cadenas', { src: 'data:,cadenas' });
  await db.set('imgsettings', 'cadenas', { s: { imgCols: 80, bg: 'lin' } });
  const next = setup({
    library: [
      { id: 'cadenas', name: 'Cadenas', canvas, src: 'data:,cadenas', tone: { imgBright: 5 } },
      { id: 'tomate', name: 'Tomate', canvas, src: 'data:,tomate', tone: { imgBright: 0 } },
    ],
    editor,
  });
  // même base que la première visite
  for (const col of ['images', 'imagesrc', 'imgsettings'])
    for (const [id, data] of Object.entries(await db.all(col))) await next.db.set(col, id, data);
  await next.lib.load();
  return next;
}

beforeEach(() => vi.restoreAllMocks());

describe('bibliothèque de l’Illustration', () => {
  it('au premier chargement, le moteur dépose ses images de départ ; ensuite il n’écrit plus rien', async () => {
    const { core, lib, engineWrites } = setup();
    await lib.load();
    expect(engineWrites).toEqual(['images/depart']);
    // ajout d'une image ou réglage de ses tons : le moteur voulait l'enregistrer pour tous
    await core.Store.put('images', 'nouvelle', {});
    await core.Store.put('imagesrc', 'nouvelle', {});
    await core.Store.put('presets', 'x', {});
    expect(engineWrites).toEqual(['images/depart', 'presets/x']);
  });

  it('un visiteur ajoute une illustration pour tous, avec ses réglages (sans boucle ni tons)', async () => {
    const { db, core, lib, toasts } = await withSaved();
    core.imgList.push({ id: 'chat', name: 'Chat', canvas, src: 'data:,chat', tone: { imgBright: 3 } });
    expect(lib.isSaved(2)).toBe(false);
    core.selImg = 2;
    core.S.imgCols = 60;
    await lib.save();
    expect(lib.isSaved(2)).toBe(true);
    expect(await db.get('imagesrc', 'chat')).toEqual({ src: 'data:,chat' });
    expect(await db.get('images', 'chat')).toMatchObject({ name: 'Chat', tone: { imgBright: 3 } });
    const { s } = (await db.get('imgsettings', 'chat')) as { s: Record<string, unknown> };
    expect(s).toMatchObject({ imgCols: 60, bg: 'lin', app: 'image' }); // fond repris de Cadenas, ouverte au départ
    expect(s).not.toHaveProperty('imgLoop');
    expect(s).not.toHaveProperty('imgBright');
    expect(toasts.at(-1)).toBe('Illustration enregistrée pour tous : Chat');
  });

  it('un visiteur ne modifie pas une illustration de l’équipe : il en enregistre une copie', async () => {
    const { db, core, lib } = await withSaved();
    expect(lib.saveLabel()).toBe('Enregistrer une copie');
    core.imgList[0].tone!.imgBright = 40;
    core.S.imgCols = 10;
    await lib.save();
    expect(await db.get('imgsettings', 'cadenas')).toEqual({ s: { imgCols: 80, bg: 'lin' } });
    expect(core.imgList.map((im) => im.name)).toEqual(['Cadenas', 'Cadenas (copie)', 'Tomate']);
    expect(core.imgList[0].tone).toEqual({ imgBright: 5 }); // l'original reprend ses tons
    expect(core.selImg).toBe(1);
    const copy = core.imgList[1];
    expect(await db.get('images', copy.id!)).toMatchObject({
      name: 'Cadenas (copie)',
      tone: { imgBright: 40 },
    });
  });

  it('renommer : pour la visite ; la copie d’un visiteur garde le nouveau nom, l’original reprend le sien', async () => {
    const { db, core, lib } = await withSaved();
    expect(lib.rename(0, '   ')).toBe(false);
    expect(lib.rename(0, '  Cadenas doré ')).toBe(true);
    expect(core.imgList[0].name).toBe('Cadenas doré');
    expect(await db.get('images', 'cadenas')).toMatchObject({ name: 'Cadenas' });
    await lib.save();
    expect(core.imgList.map((im) => im.name)).toEqual(['Cadenas', 'Cadenas doré', 'Tomate']);
    expect(await db.get('images', 'cadenas')).toMatchObject({ name: 'Cadenas' });
  });

  it('renommer en mode édition, puis mettre à jour : le nom change pour tous', async () => {
    const { db, lib } = await withSaved(true);
    lib.rename(0, 'Cadenas doré');
    await lib.save();
    expect(await db.get('images', 'cadenas')).toMatchObject({ name: 'Cadenas doré' });
  });

  it('en mode édition, l’illustration est mise à jour pour tous', async () => {
    const { db, core, lib } = await withSaved(true);
    expect(lib.saveLabel()).toBe('Mettre à jour l’illustration');
    core.S.imgCols = 99;
    await lib.save();
    expect(((await db.get('imgsettings', 'cadenas')) as { s: { imgCols: number } }).s.imgCols).toBe(99);
    expect(core.imgList).toHaveLength(2);
  });

  it('chaque illustration reprend ses réglages ; les changements de la visite sont retrouvés', async () => {
    const { core, lib } = await withSaved();
    lib.onAppChanged();
    expect(core.S).toMatchObject({ imgCols: 80, bg: 'lin', imgBright: 0 });
    core.S.imgCols = 12; // réglage de la visite, sur Cadenas
    lib.pick(1);
    expect(core.S.imgCols).toBe(12); // Tomate n'a pas de réglages enregistrés
    core.S.imgCols = 30;
    lib.pick(0);
    expect(core.S.imgCols).toBe(12);
    expect(core.S.imgBright).toBe(5);
    lib.pick(1);
    expect(core.S.imgCols).toBe(30);
  });

  it('retirer : pour cette visite chez un visiteur, pour tous en mode édition', async () => {
    const visitor = await withSaved();
    expect(await visitor.lib.remove(0)).toBe(true);
    expect(await visitor.db.get('images', 'cadenas')).not.toBeNull();
    expect(visitor.toasts.at(-1)).toMatch(/^Retirée pour cette visite/);

    const editor = await withSaved(true);
    expect(await editor.lib.remove(0)).toBe(true);
    expect(await editor.db.get('images', 'cadenas')).toBeNull();
    expect(await editor.db.get('imgsettings', 'cadenas')).toBeNull();
  });
});
