// Stockage des scripts d'intégration : remplace src/lib/store/store.ts dans vite.embed.config.ts.
// Tout reste en mémoire, le temps de la visite : rien n'est écrit dans le navigateur du visiteur ni
// envoyé à un serveur. Le script y dépose ses données (seedStore : les illustrations du dossier)
// puis l'ouvre (openStore) : la bibliothèque et le moteur, inchangés, les lisent comme d'habitude.
export type StoreItem<T = unknown> = { id: string; data: T };
export type StoreKind = 'api' | 'local';
export const EDITOR_HEADER = 'x-editor-code';
export const LOCAL_EDITOR_CODE = ''; // pas de mode édition sur le site d'un client

const collections = new Map<string, Map<string, unknown>>();
const table = (col: string) => {
  if (!collections.has(col)) collections.set(col, new Map());
  return collections.get(col)!;
};
let open: () => void = () => {};
const ready = new Promise<void>((resolve) => (open = resolve));

/** Dépose des documents : { collection: { identifiant: données } }. */
export function seedStore(data: Record<string, Record<string, unknown>>) {
  for (const [col, docs] of Object.entries(data))
    for (const [id, doc] of Object.entries(docs)) table(col).set(id, doc);
}

/** Les données sont prêtes : la bibliothèque et le moteur peuvent lire. */
export const openStore = () => open();

const store = {
  ready,
  kind: 'local' as StoreKind,
  setEditorCode() {},
  editorHeaders: (): Record<string, string> => ({}),
  async checkCode() {
    return false;
  },
  async list<T = unknown>(col: string): Promise<StoreItem<T>[]> {
    await ready;
    return [...table(col)].map(([id, data]) => ({ id, data: data as T }));
  },
  async get<T = unknown>(col: string, id: string): Promise<T | null> {
    await ready;
    return (table(col).get(id) as T | undefined) ?? null;
  },
  async put(col: string, id: string, data: unknown) {
    table(col).set(id, data);
  },
  async del(col: string, id: string) {
    table(col).delete(id);
  },
};

export type Store = typeof store;
export const createStore = () => store;
export const getStore = () => store;
