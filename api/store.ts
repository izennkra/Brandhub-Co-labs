// Service de stockage partagé (fonction Vercel) : /api/store.
// Son contrat est imposé par le Store du moteur (prototype-engine.js, lignes 1184-1218), qu'on ne
// modifie pas : ping, liste d'une collection, lecture, écriture et suppression d'un document.
// Les données sont dans Upstash Redis : une table (hash) « bhc:<collection> » par collection.
import { Redis } from '@upstash/redis';
import { codeMatches } from './_lib/editor.js';

/** Base de données du service : Upstash en ligne, en mémoire dans les tests. */
export type StoreDb = {
  all(col: string): Promise<Record<string, unknown>>;
  get(col: string, id: string): Promise<unknown>;
  set(col: string, id: string, data: unknown): Promise<void>;
  del(col: string, id: string): Promise<void>;
};

// Nom de collection : minuscules, chiffres et tirets (ex. « presets », « imagesrc »).
const COLLECTION = /^[a-z][a-z0-9-]{0,39}$/;
const MAX_ID = 200;
// Une requête Vercel ne dépasse pas 4,5 Mo : on refuse avant, avec un message clair.
export const MAX_BODY = 4 * 1024 * 1024;
// Collections des pages Ressource et préréglages partagés : seules les personnes qui ont le code
// peuvent les modifier (un visiteur garde ses préréglages dans son navigateur).
export const isProtected = (col: string) => col.startsWith('res-') || col === 'presets';
// Bibliothèque de l'Illustration : tout le monde peut y ajouter une illustration (bouton
// « Enregistrer l'illustration »), mais seul le code permet d'en modifier ou d'en supprimer une.
export const ADD_ONLY = new Set(['images', 'imagesrc', 'imgsettings']);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
const fail = (status: number, error: string) => json(status, { ok: false, error });

const validId = (id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID;

/** Traite une requête du contrat /api/store. Sans base configurée, le service se déclare absent. */
export async function handleStore(
  request: Request,
  db: StoreDb | null,
  editorCode?: string,
): Promise<Response> {
  // Le moteur reste alors en mode navigateur (il teste « ping » au démarrage).
  if (!db) return fail(503, 'stockage partagé non configuré');
  const params = new URL(request.url).searchParams;
  try {
    if (request.method === 'GET') {
      if (params.has('ping')) return json(200, { ok: true });
      // Vérification du code éditeur (champ « code » du panneau des Ressources).
      if (params.has('editor')) return json(200, { ok: true, valid: codeMatches(request, editorCode) });
      const col = params.get('col') ?? '';
      if (!COLLECTION.test(col)) return fail(400, 'collection invalide');
      const id = params.get('id');
      if (id === null) {
        const all = await db.all(col);
        return json(200, { ok: true, items: Object.entries(all).map(([key, data]) => ({ id: key, data })) });
      }
      if (!validId(id)) return fail(400, 'identifiant invalide');
      const data = await db.get(col, id);
      return json(200, { ok: true, item: data == null ? null : { data } });
    }
    if (request.method === 'POST') {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > MAX_BODY)
        return fail(413, 'document trop lourd (4 Mo au plus)');
      let body: { col?: unknown; id?: unknown; data?: unknown };
      try {
        body = JSON.parse(text);
      } catch {
        return fail(400, 'JSON invalide');
      }
      if (typeof body.col !== 'string' || !COLLECTION.test(body.col)) return fail(400, 'collection invalide');
      if (!validId(body.id)) return fail(400, 'identifiant invalide');
      if (body.data === undefined || body.data === null) return fail(400, 'données manquantes');
      if (!codeMatches(request, editorCode)) {
        if (isProtected(body.col)) return fail(403, 'code éditeur requis');
        if (ADD_ONLY.has(body.col) && (await db.get(body.col, body.id)) != null)
          return fail(403, 'code éditeur requis pour modifier une illustration enregistrée');
      }
      await db.set(body.col, body.id, body.data);
      return json(200, { ok: true });
    }
    if (request.method === 'DELETE') {
      const col = params.get('col') ?? '';
      const id = params.get('id');
      if (!COLLECTION.test(col)) return fail(400, 'collection invalide');
      if (!validId(id)) return fail(400, 'identifiant invalide');
      if ((isProtected(col) || ADD_ONLY.has(col)) && !codeMatches(request, editorCode))
        return fail(403, 'code éditeur requis');
      await db.del(col, id);
      return json(200, { ok: true });
    }
    return fail(405, 'méthode non prise en charge');
  } catch (error) {
    console.error(error);
    return fail(500, 'erreur du stockage');
  }
}

/** Base en mémoire : pour les tests (et pour essayer le service sans Upstash). */
export function memoryDb(): StoreDb {
  const tables = new Map<string, Map<string, unknown>>();
  const table = (col: string) => {
    if (!tables.has(col)) tables.set(col, new Map());
    return tables.get(col)!;
  };
  // Copie à chaque passage, comme une vraie base (pas d'objet partagé entre deux requêtes).
  const copy = (value: unknown) => (value === undefined ? null : JSON.parse(JSON.stringify(value)));
  return {
    async all(col) {
      return Object.fromEntries([...table(col)].map(([id, data]) => [id, copy(data)]));
    },
    async get(col, id) {
      return copy(table(col).get(id));
    },
    async set(col, id, data) {
      table(col).set(id, copy(data));
    },
    async del(col, id) {
      table(col).delete(id);
    },
  };
}

/** Base Upstash Redis (variables ajoutées par Vercel quand on relie Upstash au projet). */
export function redisDb(redis: Redis): StoreDb {
  const key = (col: string) => `bhc:${col}`;
  return {
    async all(col) {
      return (await redis.hgetall<Record<string, unknown>>(key(col))) ?? {};
    },
    async get(col, id) {
      return redis.hget(key(col), id);
    },
    async set(col, id, data) {
      await redis.hset(key(col), { [id]: data });
    },
    async del(col, id) {
      await redis.hdel(key(col), id);
    },
  };
}

function dbFromEnv(): StoreDb | null {
  const env = process.env;
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? redisDb(new Redis({ url, token })) : null;
}

let db: StoreDb | null | undefined;
const handle = (request: Request) => handleStore(request, (db ??= dbFromEnv()), process.env.EDITOR_CODE);

export { handle as GET, handle as POST, handle as DELETE };
