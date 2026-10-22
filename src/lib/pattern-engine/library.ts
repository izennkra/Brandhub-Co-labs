// Bibliothèque de l'Illustration : une illustration enregistrée (bouton « Enregistrer
// l'illustration ») est visible par tous, avec tous ses réglages. Le reste (images ajoutées,
// réglages changés, ordre) ne vit que le temps de la visite, sur cet écran.
// Le moteur n'est pas modifié : on retient seulement ses écritures dans « images » et « imagesrc »
// (il enregistrait chaque ajout et chaque réglage pour tout le monde), sauf au premier chargement,
// où il dépose les images de départ dans une bibliothèque vide.
import type { PresetStore } from './presets';
import type { EngineImage, EngineSettings, PrototypeEngine } from './prototype-engine.js';

export const IMAGE_COLS = ['images', 'imagesrc'];
// Réglages propres à chaque illustration enregistrée : un document par image, même identifiant.
export const SETTINGS_COL = 'imgsettings';
// Lecture de la bibliothèque (boucle) : commune à toutes les images, pas propre à une illustration.
const LIBRARY_KEYS = ['imgLoop', 'imgHold', 'imgTrans'];

type Image = EngineImage & { src?: string };
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
  }: {
    snapshot: () => Settings;
    apply: (settings: Settings) => void;
    loadTone: (index: number) => void;
    isEditor: () => boolean;
    toast: (message: string) => void;
    changed: () => void;
  },
) {
  // Illustrations enregistrées : identifiant → tons et réglages enregistrés.
  const saved = new Map<string, { tone?: EngineSettings; settings?: Settings }>();
  // Réglages changés pendant la visite, par image (retrouvés quand on revient sur elle).
  const session = new WeakMap<Image, Settings>();
  let loaded = false;
  let seeding = false;
  let applied = false;

  const enginePut = core.Store.put.bind(core.Store);
  core.Store.put = (col, id, data) =>
    IMAGE_COLS.includes(col) && !seeding ? Promise.resolve() : enginePut(col, id, data);

  // Sans service partagé, tout reste dans ce navigateur : pas besoin du mode édition.
  const canEdit = () => isEditor() || store.kind === 'local';
  const isSaved = (image: Image | undefined) => Boolean(image?.id && saved.has(image.id));
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
        src: image.src ?? image.canvas.toDataURL('image/jpeg', 0.86),
      });
    await store.put(SETTINGS_COL, image.id, { s: settings });
    // en dernier : une image n'apparaît dans la liste de tous qu'une fois complète
    await store.put('images', image.id, {
      name: image.name,
      tone: image.tone,
      inLoop: image.inLoop !== false,
      t: image.t,
    });
    saved.set(image.id, { tone: { ...image.tone }, settings });
    session.delete(image);
  };

  return {
    get loaded() {
      return loaded;
    },
    /** L'image est-elle dans la bibliothèque de tous ? */
    isSaved: (index: number) => isSaved(core.imgList[index]),

    /** Remplace loadLibrary au démarrage : charge la bibliothèque, puis ce qui est enregistré. */
    async load() {
      seeding = true;
      try {
        await core.loadLibrary();
      } finally {
        seeding = false;
      }
      await store.ready;
      const [metas, sets] = await Promise.all([
        store.list('images').catch(() => []),
        store.list(SETTINGS_COL).catch(() => []),
      ]);
      const settings = new Map(sets.map((item) => [item.id, item.data?.s as Settings | undefined]));
      for (const meta of metas) saved.set(meta.id, { settings: settings.get(meta.id) });
      for (const image of core.imgList as Image[])
        if (image.id && saved.has(image.id)) saved.get(image.id)!.tone = { ...image.tone };
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
          // Une illustration de l'équipe ne change pas : la copie emporte les changements,
          // l'original reprend ses tons enregistrés.
          const copy: Image = { ...image, id: newId(), name: copyName(image.name), t: Date.now() };
          image.tone = { ...saved.get(image.id!)!.tone };
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

    /** Retrait : pour tous en mode édition, sinon seulement pendant cette visite. */
    async remove(index: number) {
      const image = core.imgList[index] as Image | undefined;
      if (!image) return false;
      if (isSaved(image)) {
        if (!canEdit()) toast('Retirée pour cette visite : elle reste dans la bibliothèque de l’équipe.');
        else {
          try {
            await Promise.all([...IMAGE_COLS, SETTINGS_COL].map((col) => store.del(col, image.id!)));
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

    /** Ordre et boucle : enregistrés pour tous en mode édition, sinon le temps de la visite. */
    persistMeta(image: Image) {
      if (!isSaved(image) || !canEdit()) return;
      store
        .put('images', image.id!, {
          name: image.name,
          tone: saved.get(image.id!)?.tone ?? image.tone,
          inLoop: image.inLoop !== false,
          t: image.t,
        })
        .catch(() => toast('Ordre non enregistré : ouvre le mode édition.'));
    },
  };
}

export type Library = ReturnType<typeof createLibrary>;
