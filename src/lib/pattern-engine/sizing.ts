// Taille d'une illustration dans son carré, réglable une par une (1 = taille d'origine).
// Le moteur reçoit l'image redessinée plus petite ou plus grande, centrée dans le même carré :
// des icônes préparées dans des cadres identiques gardent ainsi leurs proportions entre elles,
// et un modèle 3D (cadré d'office au plus grand) peut être ramené à la taille des autres.
// Le moteur n'est pas modifié.
import type { EngineImage, PrototypeEngine } from './prototype-engine.js';
import type { ModelViews } from './models';

export const SIZE_MIN = 0.3;
export const SIZE_MAX = 1.5;

type SizedImage = EngineImage & { size?: number; lum?: unknown; blurL?: unknown; blurR?: number };

export const clampSize = (size: unknown) =>
  typeof size === 'number' && Number.isFinite(size) ? Math.min(SIZE_MAX, Math.max(SIZE_MIN, size)) : 1;

/** Place de l'image redessinée dans un carré w × h, à la taille voulue, centrée. */
export function sizedRect(w: number, h: number, size: number) {
  const sw = w * size,
    sh = h * size;
  return { x: (w - sw) / 2, y: (h - sh) / 2, w: sw, h: sh };
}

const cloneCanvas = (from: HTMLCanvasElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = from.width;
  canvas.height = from.height;
  canvas.getContext('2d')?.drawImage(from, 0, 0);
  return canvas;
};

export function createSizing(core: PrototypeEngine, models?: ModelViews) {
  // image d'origine (avant toute mise à la taille), gardée à part
  const originals = new WeakMap<SizedImage, HTMLCanvasElement>();

  const sizing = {
    /** Taille actuelle (1 = taille d'origine). */
    get: (image: EngineImage | undefined) => clampSize((image as SizedImage | undefined)?.size),

    /** Image d'origine, à enregistrer (la taille est enregistrée à part). */
    source: (image: EngineImage) => originals.get(image as SizedImage) ?? image.canvas,

    /** Redessine l'illustration à la taille voulue ; la trame suit. */
    set(image: EngineImage | undefined, value: number) {
      const sized = image as SizedImage | undefined;
      if (!sized) return;
      const size = clampSize(value);
      if (size === sizing.get(sized)) return;
      sized.size = size;
      if (models?.isModel(sized)) {
        models.setSize(sized, size);
        return;
      }
      if (!originals.has(sized)) originals.set(sized, cloneCanvas(sized.canvas));
      const original = originals.get(sized)!;
      const ctx = sized.canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = sized.canvas;
      const r = sizedRect(width, height, size);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(original, r.x, r.y, r.w, r.h);
      // caches du moteur pour cette image (luminance, flou, vignette) : à recalculer
      delete sized.lum;
      delete sized.blurL;
      delete sized.blurR;
      delete sized.thumb;
      core.imgDirty = true;
    },

    /** Copie d'une illustration : sa propre image, même origine, même taille. */
    copy(from: EngineImage, to: EngineImage) {
      const original = originals.get(from as SizedImage);
      if (models?.isModel(from)) return;
      to.canvas = cloneCanvas(from.canvas);
      if (original) originals.set(to as SizedImage, original);
    },
  };
  return sizing;
}

export type Sizing = ReturnType<typeof createSizing>;
