// Préréglages partagés : section de l'interface du prototype (lignes 2683 à 2771), recopiée à
// l'identique pour la partie moteur. Fichier léger : le panneau l'importe sans charger le moteur.
import type { AppMode } from './createEngine';
import type { PrototypeEngine } from './prototype-engine.js';

// Chaque préréglage partagé est un document de la collection « presets » du stockage.
// « mine » : préréglage d'un visiteur, gardé dans son navigateur seulement.
export type Preset = { id: string; name: string; t: number; s: Record<string, unknown>; mine?: boolean };

/** Stockage des préréglages partagés (celui de l'appli, qui joint le code éditeur). */
export type PresetStore = {
  readonly kind: string;
  readonly ready?: Promise<unknown>;
  list: (col: string) => Promise<Array<{ id: string; data: Record<string, unknown> }>>;
  put: (col: string, id: string, data: unknown) => Promise<void>;
  del: (col: string, id: string) => Promise<void>;
};

const DEF_KEY = 'bhc.presetDefault';
// Préréglages d'un visiteur : seulement dans son navigateur, personne d'autre ne les voit.
const MINE_KEY = 'bhc.mesPresets';
const MINE_PREFIX = 'moi-';

function readMine(): Preset[] {
  try {
    const list = JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
    return Array.isArray(list) ? list.filter((p) => p && p.id && p.s).map((p) => ({ ...p, mine: true })) : [];
  } catch {
    return [];
  }
}
function writeMine(list: Preset[]) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(list.map(({ id, name, t, s }) => ({ id, name, t, s }))));
    return true;
  } catch {
    return false;
  }
}
const SKIP_KEYS = new Set(['paused', 'fog', 'pinches']);

// slugName (ligne 2710) : identifiant du préréglage à partir de son nom.
export function slugName(n: string) {
  return (
    n
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'preset'
  ).slice(0, 60);
}

// fmtDate (ligne 2711) : date et outil, sous le nom du préréglage.
export function fmtDate(p: Preset) {
  try {
    return (
      new Date(p.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
      ' · ' +
      (p.s && p.s.app === 'image' ? 'Illustration' : p.s && p.s.variant === 0 ? 'Aérée' : 'Quantique') +
      (p.mine ? ' · sur cet appareil' : '')
    );
  } catch {
    return '';
  }
}

export function createPresets(
  core: PrototypeEngine,
  actions: { setApp: (mode: AppMode) => void },
  syncAll: () => void,
  toast: (message: string) => void,
  changed: () => void,
  {
    store: Store = core.Store,
    isEditor = () => false,
  }: { store?: PresetStore; isEditor?: () => boolean } = {},
) {
  let presets: Preset[] = [];
  let mine: Preset[] = [];
  // En ligne, sans le mode édition, on enregistre dans le navigateur (le partagé demande le code).
  const personal = () => Store.kind === 'api' && !isEditor();
  const all = () => [...presets, ...mine];
  let presetDefault: string | null = null;
  let loaded = false;
  // Préréglage de démarrage d'un autre outil que celui affiché : appliqué quand on l'ouvre
  // (dans le prototype, applySettings changeait d'outil ; ici, l'outil dépend de la page).
  let pendingDefault: Preset | null = null;

  // snapshotSettings (ligne 2687).
  const snapshotSettings = () => {
    const S = core.S;
    const o: Record<string, unknown> = {};
    for (const k in S) {
      if (SKIP_KEYS.has(k)) continue;
      const v = S[k];
      o[k] = v instanceof Set ? [...v] : v;
    }
    o._view = { theta: core.orbit.theta, phi: core.orbit.phi, radius: core.orbit.radius };
    return o;
  };

  // applySettings (ligne 2693). La mise à jour des boutons du prototype est remplacée par syncAll.
  const applySettings = (o: Record<string, unknown>) => {
    const S = core.S;
    if (o.app && o.app !== S.app) actions.setApp(o.app as AppMode);
    for (const k in o) {
      if (k === '_view' || SKIP_KEYS.has(k) || !(k in S)) continue;
      S[k] = k === 'dots' ? new Set(o[k] as string[]) : o[k];
    }
    S.variant = 2;
    if (S.qStruct === 0) S.qStruct = 1; // seules restent la Membrane et la Ligne
    S.fog = 0;
    S.pinches = 0;
    syncAll();
    core.rng = core.mulberry32((Math.random() * 1e9) | 0);
    core.regenerate();
    core.resetView();
    const view = o._view as { theta: number; phi: number; radius: number } | undefined;
    if (view) {
      core.orbit.theta = view.theta;
      core.orbit.phi = view.phi;
      core.orbit.radius = view.radius;
    }
    core.refreshColors();
    syncAll();
  };

  const isImage = (p: Preset) => p.s.app === 'image';

  const api = {
    /** Réglages actuels, tels qu'un préréglage les enregistre (sert aussi aux illustrations). */
    snapshot: snapshotSettings,
    /** Applique des réglages enregistrés (préréglage ou illustration). */
    applySnapshot: applySettings,
    /** Préréglages de l'outil affiché (Motif ou Illustration), du plus récent au plus ancien. */
    list() {
      return all()
        .filter((p) => isImage(p) === (core.S.app === 'image'))
        .sort((a, b) => b.t - a.t);
    },
    /** Peut-on supprimer ce préréglage ? Les siens, ou tous en mode édition. */
    canRemove(id: string) {
      return Boolean(mine.some((p) => p.id === id) || (presets.some((p) => p.id === id) && !personal()));
    },
    get loaded() {
      return loaded;
    },
    get defaultId() {
      return presetDefault;
    },
    // Texte sous la liste (renderPresets, ligne 2741).
    note() {
      if (!loaded) return 'Chargement des préréglages…';
      return Store.kind === 'local'
        ? 'Enregistrés dans ce navigateur seulement : le stockage partagé n’est pas configuré sur ce site.'
        : personal()
          ? 'Ceux de l’équipe sont visibles par tous. Les tiens restent dans ce navigateur : toi seul les vois. L’étoile choisit celui qui s’ouvre au démarrage.'
          : 'Mode édition : tes préréglages sont partagés avec toutes les personnes qui ont le lien. L’étoile choisit celui qui s’ouvre au démarrage, sur ton appareil.';
    },
    // Clic sur le nom (ligne 2724).
    apply(id: string) {
      const p = all().find((q) => q.id === id);
      if (!p) return;
      applySettings(p.s);
      toast('Préréglage appliqué : ' + p.name);
    },
    // Étoile : préréglage ouvert au démarrage, sur cet appareil (ligne 2727).
    toggleDefault(id: string) {
      const p = all().find((q) => q.id === id);
      if (!p) return;
      const isDef = presetDefault === p.id;
      presetDefault = isDef ? null : p.id;
      try {
        if (presetDefault) localStorage.setItem(DEF_KEY, presetDefault);
        else localStorage.removeItem(DEF_KEY);
      } catch {
        // stockage indisponible : le choix vaut pour cette visite
      }
      changed();
      toast(
        isDef
          ? 'Plus de préréglage au démarrage.'
          : '« ' + p.name + ' » s’ouvrira au démarrage sur cet appareil.',
      );
    },
    // Retrait (ligne 2731) ; la double confirmation est gérée par le panneau.
    async remove(id: string) {
      if (mine.some((q) => q.id === id)) {
        mine = mine.filter((q) => q.id !== id);
        writeMine(mine);
        changed();
        toast('Préréglage supprimé.');
        return;
      }
      if (personal()) return toast('Seul le mode édition peut supprimer un préréglage de l’équipe.');
      try {
        await Store.del('presets', id);
        presets = presets.filter((q) => q.id !== id);
        changed();
        toast('Préréglage supprimé.');
      } catch {
        toast('Suppression impossible : ouvre le mode édition pour supprimer un préréglage partagé.');
      }
    },
    // savePreset (ligne 2746).
    async save(input: string) {
      await core.storeReady;
      await Store.ready;
      let name = (input || '').trim().slice(0, 40);
      if (!name) {
        let i = presets.length + 1;
        while (presets.some((p) => p.name === 'Préréglage ' + i)) i++;
        name = 'Préréglage ' + i;
      }
      if (personal()) {
        const entry: Preset = {
          id: MINE_PREFIX + slugName(name),
          name,
          t: Date.now(),
          s: snapshotSettings(),
          mine: true,
        };
        const i = mine.findIndex((p) => p.id === entry.id);
        const next = i >= 0 ? mine.map((p, k) => (k === i ? entry : p)) : [entry, ...mine];
        if (!writeMine(next)) {
          toast('Espace du navigateur plein.');
          return false;
        }
        mine = next;
        changed();
        toast((i >= 0 ? 'Préréglage mis à jour : ' : 'Préréglage enregistré dans ce navigateur : ') + name);
        return true;
      }
      const id = slugName(name);
      const entry: Preset = { id, name, t: Date.now(), s: snapshotSettings() };
      try {
        await Store.put('presets', id, { name: entry.name, t: entry.t, s: entry.s });
        const i = presets.findIndex((p) => p.id === id);
        if (i >= 0) presets[i] = entry;
        else presets.unshift(entry);
        changed();
        toast(
          (i >= 0 ? 'Préréglage mis à jour : ' : 'Préréglage enregistré : ') +
            name +
            (Store.kind === 'local' ? '' : ' (visible par tous)'),
        );
        return true;
      } catch (e) {
        changed();
        toast(
          (e as { code?: string })?.code === 'quota'
            ? 'Espace du navigateur plein.'
            : 'Enregistrement impossible : ouvre le mode édition pour partager un préréglage.',
        );
        return false;
      }
    },
    /** À appeler après un changement d'outil : applique le préréglage de démarrage en attente. */
    onAppChanged() {
      if (pendingDefault && isImage(pendingDefault) === (core.S.app === 'image')) {
        const def = pendingDefault;
        pendingDefault = null;
        applySettings(def.s);
        toast('Préréglage ouvert : ' + def.name);
      }
    },
    // initPresets (ligne 2758).
    async init() {
      await core.storeReady;
      await Store.ready;
      try {
        presetDefault = localStorage.getItem(DEF_KEY);
      } catch {
        // stockage indisponible
      }
      try {
        const items = await Store.list('presets');
        presets = items
          .map((x) => ({
            id: x.id,
            name: x.data.name as string,
            t: (x.data.t as number) || 0,
            s: x.data.s as Preset['s'],
          }))
          .filter((p) => p.s)
          .sort((a, b) => b.t - a.t);
      } catch {
        presets = [];
      }
      mine = readMine();
      // anciens préréglages enregistrés dans ce navigateur : on les reprend dans la liste partagée
      try {
        const old = JSON.parse(localStorage.getItem('synapse.presets.v1') || 'null');
        if (old && Array.isArray(old.list) && old.list.length && Store.kind !== 'local') {
          for (const p of old.list) {
            const id = slugName(p.name);
            if (!presets.some((q) => q.id === id)) {
              try {
                await Store.put('presets', id, { name: p.name, t: p.t || Date.now(), s: p.s });
                presets.push({ id, name: p.name, t: p.t || Date.now(), s: p.s });
              } catch {
                break;
              }
            }
          }
          localStorage.removeItem('synapse.presets.v1');
        }
      } catch {
        // ancienne liste illisible : ignorée
      }
      loaded = true;
      changed();
      const def = all().find((p) => p.id === presetDefault);
      if (def) {
        pendingDefault = def;
        api.onAppChanged();
      }
    },
  };
  return api;
}
