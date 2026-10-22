// Fichiers des pages Ressource (fonction Vercel) : /api/files, rangés dans Vercel Blob.
// POST /api/files?name=<nom> (le fichier en corps de requête) → { ok, url } ;
// DELETE /api/files?url=<adresse> → { ok }. Les deux demandent le code éditeur.
import { del, put } from '@vercel/blob';
import { codeMatches } from './_lib/editor.js';

/** Stockage de fichiers : Vercel Blob en ligne, en mémoire dans les tests. */
export type FileStore = {
  put(pathname: string, body: ArrayBuffer, contentType: string): Promise<{ url: string }>;
  del(url: string): Promise<void>;
};

// Une requête Vercel ne dépasse pas 4,5 Mo.
export const MAX_FILE = 4 * 1024 * 1024;
// Images et polices seulement (logos SVG, images, fichiers de police).
const ALLOWED = /\.(svg|png|jpe?g|webp|gif|avif|woff2?|otf|ttf)$/i;
// On ne supprime que des fichiers de notre propre stockage Blob.
const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
const fail = (status: number, error: string) => json(status, { ok: false, error });

// Nom de fichier propre : lettres, chiffres, tirets, sans accents.
export function cleanName(name: string) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${base || 'fichier'}${dot > 0 ? name.slice(dot).toLowerCase() : ''}`;
}

export async function handleFiles(
  request: Request,
  files: FileStore | null,
  editorCode?: string,
): Promise<Response> {
  if (!files) return fail(503, 'stockage de fichiers non configuré');
  if (!codeMatches(request, editorCode)) return fail(403, 'code éditeur requis');
  const params = new URL(request.url).searchParams;
  try {
    if (request.method === 'POST') {
      const name = cleanName(params.get('name') ?? '');
      if (!ALLOWED.test(name)) return fail(400, 'type de fichier non pris en charge');
      const body = await request.arrayBuffer();
      if (!body.byteLength) return fail(400, 'fichier vide');
      if (body.byteLength > MAX_FILE) return fail(413, 'fichier trop lourd (4 Mo au plus)');
      const type = request.headers.get('content-type') || 'application/octet-stream';
      const { url } = await files.put(`ressources/${name}`, body, type);
      return json(200, { ok: true, url });
    }
    if (request.method === 'DELETE') {
      const url = params.get('url') ?? '';
      let host = '';
      try {
        host = new URL(url).hostname;
      } catch {
        host = '';
      }
      if (!BLOB_HOST.test(host)) return fail(400, 'adresse invalide');
      await files.del(url);
      return json(200, { ok: true });
    }
    return fail(405, 'méthode non prise en charge');
  } catch (error) {
    console.error(error);
    return fail(500, 'erreur du stockage de fichiers');
  }
}

/** Vercel Blob (réglages ajoutés par Vercel quand on relie Blob au projet). */
export function blobFiles(): FileStore {
  return {
    async put(pathname, body, contentType) {
      const blob = await put(pathname, body, { access: 'public', addRandomSuffix: true, contentType });
      return { url: blob.url };
    },
    async del(url) {
      await del(url);
    },
  };
}

/** Blob est-il relié au projet ? Ancienne façon (jeton) ou nouvelle (BLOB_STORE_ID + connexion Vercel). */
export const blobConfigured = (env: Record<string, string | undefined>) =>
  Boolean(env.BLOB_READ_WRITE_TOKEN?.trim() || env.BLOB_STORE_ID?.trim());

const handle = (request: Request) =>
  handleFiles(request, blobConfigured(process.env) ? blobFiles() : null, process.env.EDITOR_CODE);

export { handle as POST, handle as DELETE };
