// QR codes de la page Ressource › QR code (module QR de VisualSystem : encodage par le paquet qrcode,
// correction d'erreur la plus forte, marge de 4 modules). La trame de l'Illustration abîme un peu le
// dessin : la correction H laisse au téléphone de quoi le lire.
import QRCode from 'qrcode';

/** Marge blanche autour du QR, en modules (la « zone calme » que les lecteurs attendent). */
export const QR_MARGIN = 4;
/** Taille maximale du contenu (guide VisualSystem). */
export const QR_MAX_BYTES = 1200;
/** Côté de l'image envoyée à l'Illustration, en pixels. */
export const QR_IMAGE_PX = 1200;

export type QrMatrix = { size: number; dark: (x: number, y: number) => boolean };

/** Grille du QR (sans la marge), ou un message si le texte ne peut pas être encodé. */
export function qrMatrix(text: string): QrMatrix | { error: string } {
  const value = text.trim();
  if (!value) return { error: 'Colle un lien pour créer le QR code.' };
  if (new TextEncoder().encode(value).length > QR_MAX_BYTES)
    return { error: 'Lien trop long pour un QR code lisible.' };
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'H' });
  return { size: modules.size, dark: (x, y) => Boolean(modules.get(y, x)) };
}

/** Tracé SVG des modules sombres (un carré par module), marge comprise dans les coordonnées. */
export function qrPath(matrix: QrMatrix) {
  let d = '';
  for (let y = 0; y < matrix.size; y++)
    for (let x = 0; x < matrix.size; x++)
      if (matrix.dark(x, y)) d += `M${x + QR_MARGIN} ${y + QR_MARGIN}h1v1h-1z`;
  return d;
}

/** Côté total du QR en modules, marge comprise. */
export const qrSide = (matrix: QrMatrix) => matrix.size + 2 * QR_MARGIN;

/** Image carrée du QR (noir sur blanc, marge comprise), prête pour l'Illustration. */
export function drawQr(matrix: QrMatrix, px = QR_IMAGE_PX) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const cell = px / qrSide(matrix);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = 'black';
  for (let y = 0; y < matrix.size; y++)
    for (let x = 0; x < matrix.size; x++)
      if (matrix.dark(x, y)) {
        // bords arrondis au pixel : pas de liseré clair entre deux modules voisins
        const x0 = Math.round((x + QR_MARGIN) * cell),
          y0 = Math.round((y + QR_MARGIN) * cell);
        ctx.fillRect(
          x0,
          y0,
          Math.round((x + 1 + QR_MARGIN) * cell) - x0,
          Math.round((y + 1 + QR_MARGIN) * cell) - y0,
        );
      }
  return canvas;
}

/** Nom proposé : « QR » suivi du site du lien. */
export function qrName(text: string) {
  try {
    return 'QR ' + new URL(text.trim()).hostname.replace(/^www\./, '');
  } catch {
    return 'QR code';
  }
}
