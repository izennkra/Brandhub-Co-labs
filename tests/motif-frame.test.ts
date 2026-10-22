import { describe, expect, it } from 'vitest';
import { motifFrame } from '../src/lib/pattern-engine/exporter';

describe('export du Motif : toujours en 16:9', () => {
  it('scène en portrait : élargie en 16:9 à hauteur égale, centrée (les côtés cachés sont exportés)', () => {
    expect(motifFrame(964, 1292)).toEqual({ width: 2297, height: 1292, left: -666 });
  });

  it('petit écran de téléphone : 16:9 aussi', () => {
    const frame = motifFrame(79, 796);
    expect(frame.width / frame.height).toBeCloseTo(16 / 9, 2);
  });

  it('scène déjà en 16:9 : rien ne change', () => {
    expect(motifFrame(1600, 900)).toEqual({ width: 1600, height: 900, left: 0 });
  });
});
