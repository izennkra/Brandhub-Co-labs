import { readAsDataUrl } from './files';

// Téléchargements des Ressources : un fichier, ou un logo SVG converti en PNG.

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Un fichier distant (Vercel Blob) est récupéré d'abord, pour garder son nom au téléchargement. */
export async function downloadFile(url: string, filename: string) {
  if (url.startsWith('data:')) return downloadUrl(url, filename);
  const response = await fetch(url);
  downloadBlob(await response.blob(), filename);
}

export const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'fichier';

/** Logo SVG → PNG, côté le plus long = `size` pixels, fond transparent. */
export async function svgToPng(svg: string, size = 2048) {
  const src = await readAsDataUrl(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = src;
  await img.decode();
  const w = img.naturalWidth || 1,
    h = img.naturalHeight || 1;
  const scale = size / Math.max(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG vide'))), 'image/png'),
  );
}

const imageExtension = (url: string) =>
  url.startsWith('data:image/webp')
    ? 'webp'
    : (url.match(/\.(png|jpe?g|webp|gif|avif|svg)(?:$|\?)/i)?.[1] ?? 'png');

/** Nom de fichier d'une image de galerie (Imagerie, Patterns, Inspiration). */
export const imageFileName = (image: { name: string; url: string }) =>
  `${slug(image.name)}.${imageExtension(image.url)}`;

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Plusieurs fichiers dans un seul .zip (polices d'une famille, logos déclinés…). */
export async function downloadZip(zipName: string, entries: { name: string; data: Blob | string }[]) {
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    let data: Uint8Array;
    if (typeof entry.data === 'string' && !/^(data:|https?:|\/)/.test(entry.data)) data = strToU8(entry.data);
    else {
      const blob = typeof entry.data === 'string' ? await (await fetch(entry.data)).blob() : entry.data;
      data = new Uint8Array(await blob.arrayBuffer());
    }
    files[entry.name] = data;
  }
  const zipped = zipSync(files, { level: 6 });
  downloadBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), zipName);
}
