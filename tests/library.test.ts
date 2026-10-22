import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleStore, memoryDb, type StoreDb } from '../api/store';
import { createLibrary } from '../src/lib/pattern-engine/library';
import type { PrototypeEngine } from '../src/lib/pattern-engine/prototype-engine.js';
import { createStore } from '../src/lib/store/store';

const CODE = 'colabs-2026';
const canvas = {
  width: 700,
  height: 700,
  toDataURL: () => 'data:image/jpeg;base64,AAA',
  getContext: () => null,
} as unknown as HTMLCanvasElement;
type Img = {
  id?: string;
  name: string;
  canvas: HTMLCanvasElement;
  tone?: Record<string, unknown>;
  src?: string;
};

// Moteur simulé : réglages, liste d'images, et le Store du moteur (qui écrivait tout pour tout le monde).
// Modèles 3D simulés : on note ce que la bibliothèque leur demande.
function fakeModels() {
  const attached: string[] = [];
  const copies: string[] = [];
  const states = new Map<Img, { yaw: number; pitch: number; flat: boolean }>();
  return {
    attached,
    copies,
    states,
    views: {
      defs: [{ id: 'modele-prisme', name: 'Prisme (modèle 3D)', url: '/prisme.glb', yaw: 0, pitch: 0 }],
      blank: () => canvas,
      attach: (image: Img, model: string, state?: { yaw?: number; pitch?: number; flat?: boolean }) => {
        (image as Img & { model?: string }).model = model;
        attached.push(`${image.id}:${model}`);
        states.set(image, { yaw: state?.yaw ?? 0, pitch: state?.pitch ?? 0, flat: state?.flat === true });
      },
      stateOf: (image: Img) => states.get(image),
      setFlat: (image: Img, flat: boolean) => {
        const state = states.get(image);
        if (state) state.flat = flat;
      },
      copyView: (_from: Img, to: Img) => void copies.push(to.name),
      isModel: () => true,
      tick: () => {},
    },
  };
}

function setup({
  library = [] as Img[],
  editor = false,
  models = null as ReturnType<typeof fakeModels> | null,
} = {}) {
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
    models: models?.views as never,
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

  it('charge les images toutes ensemble et sait d’avance lesquelles sont enregistrées', async () => {
    const source = await withSaved();
    const { db, core, lib } = setup();
    for (const col of ['images', 'imagesrc', 'imgsettings'])
      for (const [id, data] of Object.entries(await source.db.all(col))) await db.set(col, id, data);
    const engineGet = vi.fn(async (_col: string, _id: string) => ({ src: 'lent', _col, _id }));
    const store = core.Store as unknown as { get: typeof engineGet };
    store.get = engineGet;
    let seen: unknown = null;
    let savedDuring = false;
    core.loadLibrary = async () => {
      seen = await store.get('imagesrc', 'cadenas');
      core.imgList = [{ id: 'cadenas', name: 'Cadenas', canvas, tone: {} }];
      savedDuring = lib.isSaved(0);
    };
    expect(lib.loaded).toBe(false);
    await lib.load();
    expect(seen).toEqual({ src: 'data:,cadenas' });
    expect(engineGet).not.toHaveBeenCalled();
    expect(savedDuring).toBe(true);
    expect(store.get).toBe(engineGet); // le moteur retrouve sa lecture normale
    expect(lib.loaded).toBe(true);
  });

  it('bibliothèque vide : les images de départ déposées par le moteur comptent comme enregistrées', async () => {
    const { db, core, lib } = setup();
    core.loadLibrary = async () => {
      // le moteur range ses images de départ dans la bibliothèque partagée, puis les affiche
      await db.set('images', 'depart', { name: 'Départ' });
      core.imgList = [{ id: 'depart', name: 'Départ', canvas, tone: {} }];
    };
    await lib.load();
    expect(lib.isSaved(0)).toBe(true);
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

  it('modèles 3D : proposés à tous d’office, cachés pour tous en mode édition, copiés avec leur modèle', async () => {
    const models = fakeModels();
    const visitor = setup({ library: [{ id: 'cadenas', name: 'Cadenas', canvas, tone: {} }], models });
    await visitor.db.set('images', 'cadenas', { name: 'Cadenas', t: 1 });
    await visitor.lib.load();
    const names = visitor.core.imgList.map((im) => im.name);
    expect(names).toContain('Prisme (modèle 3D)');
    const index = visitor.core.imgList.findIndex((im) => im.id === 'modele-prisme');
    expect(visitor.lib.isSaved(index)).toBe(true);
    expect(models.attached).toContain('modele-prisme:modele-prisme');

    // un visiteur enregistre une copie : elle garde son modèle 3D
    visitor.core.selImg = index;
    await visitor.lib.save();
    const copy = visitor.core.imgList[index + 1];
    expect(models.copies).toEqual([copy.name]);
    expect(await visitor.db.get('images', copy.id!)).toMatchObject({ model: 'modele-prisme' });

    // en mode édition, la croix le cache pour tous ; il ne revient pas au chargement suivant
    const editor = setup({ editor: true, models: fakeModels() });
    await editor.lib.load();
    const builtIn = editor.core.imgList.findIndex((im) => im.id === 'modele-prisme');
    expect(await editor.lib.remove(builtIn)).toBe(true);
    expect(await editor.db.get('images', 'modele-prisme')).toMatchObject({ hidden: true });
    const next = setup({ models: fakeModels() });
    for (const [id, data] of Object.entries(await editor.db.all('images')))
      await next.db.set('images', id, data);
    await next.lib.load();
    expect(next.core.imgList.map((im) => im.id)).not.toContain('modele-prisme');
  });

  it('modèles 3D : « Enregistrer » garde pour tous l’angle et l’aplatissement', async () => {
    const models = fakeModels();
    const editor = setup({ editor: true, models });
    await editor.lib.load();
    editor.core.selImg = editor.core.imgList.findIndex((im) => im.id === 'modele-prisme');
    expect(editor.lib.modelView()).toMatchObject({ flat: false });
    // tourné puis aplati, puis enregistré
    models.states.get(editor.core.imgList[editor.core.selImg])!.yaw = 1.2;
    editor.lib.setFlat(true);
    await editor.lib.save();
    expect(await editor.db.get('images', 'modele-prisme')).toMatchObject({ yaw: 1.2, flat: true });

    // un autre visiteur le retrouve aplati, sous le même angle
    const next = setup({ models: fakeModels() });
    for (const [id, data] of Object.entries(await editor.db.all('images')))
      await next.db.set('images', id, data);
    await next.lib.load();
    next.core.selImg = next.core.imgList.findIndex((im) => im.id === 'modele-prisme');
    expect(next.lib.modelView()).toEqual({ yaw: 1.2, pitch: 0, flat: true });

    // repassé en 3D et enregistré : de nouveau en 3D pour tous
    editor.lib.setFlat(false);
    await editor.lib.save();
    expect(await editor.db.get('images', 'modele-prisme')).toMatchObject({ flat: false });
  });
});

describe('taille de chaque illustration', () => {
  it('part de la taille d’origine ; « Enregistrer » garde la taille pour tous, avec l’image d’origine', async () => {
    const editor = await withSaved(true);
    editor.core.selImg = 0;
    expect(editor.lib.sizeOf()).toBe(1);
    editor.lib.setSize(0.7);
    expect(editor.lib.sizeOf()).toBe(0.7);
    editor.lib.setSize(9); // limitée
    expect(editor.lib.sizeOf()).toBe(1.5);
    editor.lib.setSize(0.7);
    await editor.lib.save();
    expect(await editor.db.get('images', 'cadenas')).toMatchObject({ size: 0.7 });

    // au chargement suivant, l'illustration reprend sa taille
    const next = setup({
      library: [{ id: 'cadenas', name: 'Cadenas', canvas, src: 'data:,cadenas', tone: {} }],
    });
    for (const col of ['images', 'imagesrc', 'imgsettings'])
      for (const [id, data] of Object.entries(await editor.db.all(col))) await next.db.set(col, id, data);
    await next.lib.load();
    next.core.selImg = 0;
    expect(next.lib.sizeOf()).toBe(0.7);

    // revenue à 100 % et enregistrée : plus de taille à part
    editor.lib.setSize(1);
    await editor.lib.save();
    expect(await editor.db.get('images', 'cadenas')).not.toHaveProperty('size');
  });
});
