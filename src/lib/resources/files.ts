import { getStore } from '../store/store';

// Fichiers des Ressources (logos, images, polices). Avec le service partagé : Vercel Blob (/api/files).
// Sans service, ou sans Blob configuré : le fichier est gardé dans les données (adresse « data: »),
// les images étant réduites pour tenir dans le navigateur.

const MAX_SIDE = 1600; // côté le plus long d'une image gardée dans le navigateur

export const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const readAsText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

/** Dimensions d'une image (adresse ou data URL). */
export function imageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('image illisible'));
    img.src = src;
  });
}

async function shrink(file: File) {
  const src = await readAsDataUrl(file);
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif')
    return src;
  const { width, height } = await imageSize(src);
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  if (scale === 1 && file.size < 400_000) return src;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const img = new Image();
  img.src = src;
  await img.decode();
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.85);
}

/** Range un fichier et renvoie son adresse. */
export async function saveResourceFile(file: File): Promise<string> {
  const store = getStore();
  await store.ready;
  if (store.kind === 'api') {
    const response = await fetch(`/api/files?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream', ...store.editorHeaders() },
      body: file,
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.ok) return body.url as string;
    if (response.status !== 503) throw new Error(body.error || `HTTP ${response.status}`);
  }
  return shrink(file);
}

/** Supprime un fichier rangé dans Vercel Blob (rien à faire pour une adresse « data: »). */
export async function removeResourceFile(url: string | undefined) {
  if (!url || url.startsWith('data:')) return;
  const store = getStore();
  await fetch(`/api/files?url=${encodeURIComponent(url)}`, {
    method: 'DELETE',
    headers: store.editorHeaders(),
  }).catch(() => undefined);
}
