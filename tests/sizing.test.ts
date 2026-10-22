import { describe, expect, it } from 'vitest';
import { clampSize, sizedRect } from '../src/lib/pattern-engine/sizing';

describe('taille d’une illustration dans son carré', () => {
  it('100 % : l’image d’origine, telle quelle', () => {
    expect(sizedRect(700, 700, 1)).toEqual({ x: 0, y: 0, w: 700, h: 700 });
  });

  it('plus petite : centrée dans le même carré', () => {
    expect(sizedRect(700, 700, 0.5)).toEqual({ x: 175, y: 175, w: 350, h: 350 });
  });

  it('bornée entre 30 % et 150 % ; sans taille enregistrée, la taille d’origine', () => {
    expect(clampSize(0.1)).toBe(0.3);
    expect(clampSize(4)).toBe(1.5);
    expect(clampSize(undefined)).toBe(1);
  });
});
