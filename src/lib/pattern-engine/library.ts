// Bibliothèque de l'Illustration : une illustration enregistrée (bouton « Enregistrer
// l'illustration ») est visible par tous, avec tous ses réglages. Le reste (images ajoutées,
// réglages changés, ordre) ne vit que le temps de la visite, sur cet écran.
// Le moteur n'est pas modifié : on retient seulement ses écritures dans « images » et « imagesrc »
// (il enregistrait chaque ajout et chaque réglage pour tout le monde), sauf au premier chargement,
// où il dépose les images de départ dans une bibliothèque vide.
import type { ModelState, ModelViews } from './models';
import type { PresetStore } from './presets';
import type { EngineImage, EngineSettings, PrototypeEngine } from './prototype-engine.js';

export const IMAGE_COLS = ['images', 'imagesrc'];
// Réglages propres à chaque illustration enregistrée : un document par image, même identifiant.
export const SETTINGS_COL = 'imgsettings';
// Lecture de la bibliothèque (boucle) : commune à toutes les images, pas propre à une illustration.
const LIBRARY_KEYS = ['imgLoop', 'imgHold', 'imgTrans'];

// model : illustration en 3D (models.ts), identifiant de son modèle.
type Image = EngineImage & { src?: string; model?: string; demo?: boolean };
// Document « images » : nom, tons, boucle, ordre ; hidden = modèle 3D supprimé par l'équipe ;
// yaw, pitch, flat : angle d'une illustration 3D et si elle est aplatie.
type Meta = Partial<ModelState> & {
  name?: string;
  tone?: EngineSettings;
  inLoop?: boolean;
  t?: number;
  model?: string;
  hidden?: boolean;
};
// Tons de départ d'une illustration (ceux d'une image ajoutée dans le moteur).
const START_TONE = {
  imgBright: 0,
  imgContr: 10,
  imgGamma: 1,
  imgLow: 8,
  imgHigh: 94,
  imgBlur: 1,
  imgInvert: false,
};
type Settings = Record<string, unknown>;

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const copyName = (name: string) => `${name} (copie)`.slice(0, 80);

export function createLibrary(
  core: PrototypeEngine,
  store: PresetStore & { ready: Promise<unknown> },
  {
    snapshot,
    apply,
    loadTone,
    isEditor,
    toast,
    changed,
    models,
  }: {
    snapshot: () => Settings;
    apply: (settings: Settings) => void;
    loadTone: (index: number) => void;
    isEditor: () => boolean;
    toast: (message: string) => void;
    changed: () => void;
    models?: ModelViews;
  },
) {
  // Illustrations enregistrées : identifiant → nom, tons et réglages enregistrés.
  const saved = new Map<
    string,
    { name?: string; tone?: EngineSettings; settings?: Settings; view?: ModelState }
  >();
  // Réglages changés pendant la visite, par image (retrouvés quand on revient sur elle).
  const session = new WeakMap<Image, Settings>();
  // Tant que la bibliothèque n'est pas chargée, le moteur montre ses images de démonstration :
  // l'interface affiche « Chargement des illustrations… » à la place.
  let loaded = false;
  let seeding = false;
  let applied = false;

  const enginePut = core.Store.put.bind(core.Store);
  core.Store.put = (col, id, data) =>
    IMAGE_COLS.includes(col) && !seeding ? Promise.resolve() : enginePut(col, id, data);

  // Sans service partagé, tout reste dans ce navigateur : pas besoin du mode édition.
  const canEdit = () => isEditor() || store.kind === 'local';
  const isSaved = (image: Image | undefined) => Boolean(image?.id && saved.has(image.id));
  // Modèle 3D proposé d'office (pas une copie) : on le cache pour tous au lieu de l'effacer.
  const isBuiltIn = (image: Image) => Boolean(image.model && image.id === image.model);
  const selected = () => core.imgList[core.selImg] as Image | undefined;

  // Réglages de l'illustration affichée, sans la boucle ni les tons (gardés avec l'image).
  const own = () => {
    const settings = snapshot();
    for (const key of [...LIBRARY_KEYS, ...core.TONE_KEYS]) delete settings[key];
    return settings;
  };
  const settingsOf = (image: Image | undefined) =>
    image && (session.get(image) ?? (image.id ? saved.get(image.id)?.settings : undefined));
  const show = (settings: Settings) => {
    apply({ ...settings, app: 'image' });
    core.imgDirty = true;
  };

  const write = async (image: Image, isNew: boolean) => {
    image.id ||= newId();
    image.t ||= Date.now();
    const settings = own();
    if (isNew)
      await store.put('imagesrc', image.id, {
        // illustration 3D : la vue en PNG, fond transparent quand elle est aplatie
        src: image.src ?? image.canvas.toDataURL(image.model ? 'image/png' : 'image/jpeg', 0.86),
      });
    await store.put(SETTINGS_COL, image.id, { s: settings });
    const view = models?.stateOf(image);
    // en dernier : une image n'apparaît dans la liste de tous qu'une fois complète
    await store.put('images', image.id, {
      name: image.name,
      tone: image.tone,
      inLoop: image.inLoop !== false,
      t: image.t,
      ...(image.model ? { model: image.model, ...view } : {}),
    });
    saved.set(image.id, { name: image.name, tone: { ...image.tone }, settings, view });
    session.delete(image);
  };

  // Modèles 3D : ceux proposés d'office (sauf s'ils ont été supprimés) et les copies enregistrées.
  const addModels = (metas: Map<string, Meta>) => {
    if (!models) return;
    const list = core.imgList as Image[];
    // images de démonstration du moteur (bibliothèque vide) : remplacées par les modèles
    if (list.some((image) => image.demo)) core.imgList = list.filter((image) => !image.demo);
    models.defs.forEach((def, k) => {
      const meta = metas.get(def.id);
      if (meta?.hidden) return;
      let image = (core.imgList as Image[]).find((im) => im.id === def.id);
      if (!image) {
        image = {
          id: def.id,
          name: meta?.name ?? def.name,
          canvas: models.blank(),
          tone: { ...START_TONE, ...meta?.tone },
          inLoop: meta?.inLoop !== false,
          t: meta?.t ?? k + 1, // jamais déplacé : en tête de liste, à une place qui ne bouge pas
        };
        core.imgList.push(image);
      }
      models.attach(image, def.id, meta);
      const view = models.stateOf(image);
      saved.set(def.id, { ...saved.get(def.id), name: image.name, tone: { ...image.tone }, view });
    });
    for (const [id, meta] of metas)
      if (meta?.model && !meta.hidden && id !== meta.model) {
        const image = (core.imgList as Image[]).find((im) => im.id === id);
        if (!image) continue;
        models.attach(image, meta.model, meta);
        saved.set(id, { ...saved.get(id), view: models.stateOf(image) });
      }
    core.imgList.sort((a, b) => (a.t || 0) - (b.t || 0));
    core.curImg = core.selImg = 0;
    core.imgTr = null;
    core.imgDirty = true;
  };

  return {
    get loaded() {
      return loaded;
    },
    /** Mode édition (ou site sans stockage partagé) : enregistrer et supprimer valent pour tous. */
    canEdit,
    /** Stockage partagé en ligne : le mode édition a un sens. */
    get shared() {
      return store.kind === 'api';
    },
    /** L'image est-elle dans la bibliothèque de tous ? */
    isSaved: (index: number) => isSaved(core.imgList[index]),

    /** Remplace loadLibrary au démarrage : charge la bibliothèque, puis ce qui est enregistré. */
    async load() {
      // Ce qui est enregistré est connu avant que la liste s'affiche (pas de « non enregistrée » fugace).
      await store.ready;
      const [metas, sets] = await Promise.all([
        store.list('images').catch(() => []),
        store.list(SETTINGS_COL).catch(() => []),
      ]);
      const settings = new Map(sets.map((item) => [item.id, item.data?.s as Settings | undefined]));
      for (const meta of metas) saved.set(meta.id, { settings: settings.get(meta.id) });
      // Le moteur demande les images une par une (plusieurs secondes) : on les charge toutes
      // ensemble, puis on lui répond depuis ce cache.
      const sources = new Map(
        await Promise.all(
          metas.map(
            async (meta) => [meta.id, await store.get?.('imagesrc', meta.id).catch(() => null)] as const,
          ),
        ),
      );
      const engineGet = core.Store.get;
      core.Store.get = (col, id) =>
        col === 'imagesrc' && sources.get(id)
          ? Promise.resolve(sources.get(id) as EngineSettings)
          : engineGet.call(core.Store, col, id);
      seeding = true;
      try {
        await core.loadLibrary();
      } finally {
        seeding = false;
        core.Store.get = engineGet;
      }
      // bibliothèque vide au départ : le moteur vient d'y déposer ses images de départ
      if (!metas.length)
        for (const meta of await store.list('images').catch(() => [])) saved.set(meta.id, {});
      if (models) addModels(new Map(metas.map((meta) => [meta.id, meta.data as Meta])));
      for (const image of core.imgList as Image[])
        if (image.id && saved.has(image.id))
          Object.assign(saved.get(image.id)!, { name: image.name, tone: { ...image.tone } });
      loaded = true;
      changed();
      this.onAppChanged();
    },

    /** À l'ouverture de l'Illustration : la première illustration montre ses réglages enregistrés. */
    onAppChanged() {
      if (applied || !loaded || core.S.app !== 'image') return;
      applied = true;
      const settings = settingsOf(selected());
      if (settings) show(settings);
    },

    /** Choisir une illustration : elle reprend ses réglages (ceux de la visite, sinon les enregistrés). */
    pick(index: number) {
      const from = selected();
      const to = core.imgList[index] as Image | undefined;
      if (!to) return;
      if (from && from !== to && core.S.app === 'image') session.set(from, own());
      core.showImage(index);
      const settings = from !== to ? settingsOf(to) : undefined;
      if (settings) show(settings);
      loadTone(index);
    },

    /** Texte du bouton, selon l'illustration choisie. */
    saveLabel() {
      if (!isSaved(selected())) return 'Enregistrer l’illustration';
      return canEdit() ? 'Mettre à jour l’illustration' : 'Enregistrer une copie';
    },

    note() {
      return canEdit()
        ? 'Tes changements restent sur cet écran tant que tu n’enregistres pas. Une illustration enregistrée est visible par tous, avec tous ses réglages.'
        : 'Tes changements ne sont visibles que par toi, le temps de ta visite. Enregistre une illustration pour l’ajouter à l’outil, pour tout le monde.';
    },

    /** Bouton « Enregistrer l'illustration » : l'illustration choisie, avec tous ses réglages. */
    async save() {
      const index = core.selImg;
      const image = selected();
      if (!image) return;
      await store.ready;
      try {
        if (isSaved(image) && !canEdit()) {
          // Une illustration de l'équipe ne change pas : la copie emporte les changements (nom compris),
          // l'original reprend son nom et ses tons enregistrés.
          const original = saved.get(image.id!)!;
          const renamed = original.name !== undefined && image.name !== original.name;
          const copy: Image = {
            ...image,
            id: newId(),
            name: renamed ? image.name : copyName(image.name),
            t: Date.now(),
          };
          // copie d'une illustration 3D : même modèle, mais sa propre vue
          if (image.model) models?.copyView(image, copy);
          image.tone = { ...original.tone };
          image.name = original.name ?? image.name;
          session.delete(image);
          await write(copy, true);
          core.imgList.splice(index + 1, 0, copy);
          core.curImg = core.selImg = index + 1;
          core.imgTr = null;
          core.imgDirty = true;
          loadTone(index + 1);
          toast('Copie enregistrée pour tous : ' + copy.name);
        } else {
          const isNew = !isSaved(image);
          await write(image, isNew);
          toast(
            (isNew ? 'Illustration enregistrée pour tous : ' : 'Illustration mise à jour : ') + image.name,
          );
        }
      } catch {
        toast('Enregistrement impossible. Réessaie dans un instant.');
      }
      changed();
    },

    /** Illustration 3D choisie : est-elle aplatie ? (undefined si ce n'est pas un modèle 3D) */
    modelView() {
      return models?.stateOf(selected());
    },

    /** Aplatir ou repasser en 3D (pour la visite ; « Enregistrer » le garde pour tous). */
    setFlat(flat: boolean) {
      models?.setFlat(selected(), flat);
      changed();
    },

    /** Retrait : pour tous en mode édition, sinon seulement pendant cette visite. */
    async remove(index: number) {
      const image = core.imgList[index] as Image | undefined;
      if (!image) return false;
      if (isSaved(image)) {
        if (!canEdit()) toast('Retirée pour cette visite : elle reste dans la bibliothèque de l’équipe.');
        else {
          try {
            if (isBuiltIn(image)) {
              await store.put('images', image.id!, {
                name: image.name,
                t: image.t,
                model: image.model,
                hidden: true,
              });
              await store.del(SETTINGS_COL, image.id!);
            } else await Promise.all([...IMAGE_COLS, SETTINGS_COL].map((col) => store.del(col, image.id!)));
          } catch {
            toast('Suppression impossible : ouvre le mode édition.');
            return false;
          }
          saved.delete(image.id!);
          toast('Illustration supprimée pour tous.');
        }
      }
      changed();
      return true;
    },

    /** Renommer : pour la visite ; « Enregistrer » le garde pour tous (ou en fait une copie). */
    rename(index: number, name: string) {
      const image = core.imgList[index] as Image | undefined;
      const clean = name.trim().slice(0, 80);
      if (!image || !clean || clean === image.name) return false;
      image.name = clean;
      changed();
      return true;
    },

    /** Ordre et boucle : enregistrés pour tous en mode édition, sinon le temps de la visite. */
    persistMeta(image: Image) {
      if (!isSaved(image) || !canEdit()) return;
      store
        .put('images', image.id!, {
          name: saved.get(image.id!)?.name ?? image.name,
          tone: saved.get(image.id!)?.tone ?? image.tone,
          inLoop: image.inLoop !== false,
          t: image.t,
          ...(image.model ? { model: image.model, ...saved.get(image.id!)?.view } : {}),
        })
        .catch(() => toast('Ordre non enregistré : ouvre le mode édition.'));
    },
  };
}

export type Library = ReturnType<typeof createLibrary>;
