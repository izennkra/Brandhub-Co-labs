// Stockage de l'appli (pages Ressource, Réglages…), sans charger le moteur de patterns.
// Même fonctionnement et mêmes clés que le Store du moteur (prototype-engine.js, lignes 1184-1218) :
// le service partagé /api/store s'il répond, sinon ce navigateur (localStorage « bhc.store.<collection> »).
// Les deux voient donc les mêmes données.

export type StoreItem<T = unknown> = { id: string; data: T };
export type StoreKind = 'api' | 'local';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export function createStore({
  fetch: request = (input, init) => fetch(input, init),
  storage = typeof localStorage === 'undefined' ? null : localStorage,
}: { fetch?: Fetch; storage?: Storage | null } = {}) {
  let kind: StoreKind = 'local';

  const localKey = (col: string) => `bhc.store.${col}`;
  const readLocal = (col: string): Record<string, unknown> => {
    try {
      return JSON.parse(storage?.getItem(localKey(col)) || '{}') || {};
    } catch {
      return {};
    }
  };
  const writeLocal = (col: string, all: Record<string, unknown>) => {
    try {
      storage?.setItem(localKey(col), JSON.stringify(all));
      return Boolean(storage);
    } catch {
      return false;
    }
  };
  const query = (col: string, id?: string) =>
    `/api/store?col=${encodeURIComponent(col)}` + (id === undefined ? '' : `&id=${encodeURIComponent(id)}`);

  const ready = (async () => {
    try {
      const response = await request('/api/store?ping=1', { cache: 'no-store' });
      if (response.ok && (await response.json())?.ok) kind = 'api';
    } catch {
      // pas de service : on reste dans le navigateur
    }
  })();

  return {
    /** Résolu quand on sait où sont les données (service partagé ou navigateur). */
    ready,
    get kind() {
      return kind;
    },
    async list<T = unknown>(col: string): Promise<StoreItem<T>[]> {
      await ready;
      if (kind === 'api') {
        const body = await (await request(query(col), { cache: 'no-store' })).json();
        if (!body.ok) throw new Error(body.error || 'api');
        return body.items;
      }
      return Object.entries(readLocal(col)).map(([id, data]) => ({ id, data: data as T }));
    },
    async get<T = unknown>(col: string, id: string): Promise<T | null> {
      await ready;
      if (kind === 'api') {
        const body = await (await request(query(col, id), { cache: 'no-store' })).json();
        return body.ok && body.item ? body.item.data : null;
      }
      return (readLocal(col)[id] as T) ?? null;
    },
    async put(col: string, id: string, data: unknown): Promise<void> {
      await ready;
      if (kind === 'api') {
        const response = await request('/api/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ col, id, data }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.ok) throw new Error(body.error || `HTTP ${response.status}`);
        return;
      }
      const all = readLocal(col);
      all[id] = data;
      if (!writeLocal(col, all)) throw Object.assign(new Error('plein'), { code: 'quota' });
    },
    async del(col: string, id: string): Promise<void> {
      await ready;
      if (kind === 'api') {
        const response = await request(query(col, id), { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return;
      }
      const all = readLocal(col);
      delete all[id];
      writeLocal(col, all);
    },
  };
}

export type Store = ReturnType<typeof createStore>;

let shared: Store | null = null;

/** Le stockage de l'appli : créé à la première demande, puis réutilisé. */
export function getStore(): Store {
  shared ??= createStore();
  return shared;
}
