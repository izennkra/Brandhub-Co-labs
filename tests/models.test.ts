import { describe, expect, it } from 'vitest';
import { keepSlots, MODELS, takeRotation } from '../src/lib/pattern-engine/models';

describe('illustrations en 3D : la rotation passe au modèle', () => {
  it('reporte l’écart de la caméra sur le modèle et remet la trame face à soi', () => {
    const orbit = { theta: 0.3, phi: Math.PI / 2 - 0.2 };
    const view = { yaw: 1, pitch: 0 };
    expect(takeRotation(orbit, view)).toBe(true);
    expect(view.yaw).toBeCloseTo(0.7);
    expect(view.pitch).toBeCloseTo(0.2);
    expect(orbit).toEqual({ theta: 0, phi: Math.PI / 2 });
    expect(takeRotation(orbit, view)).toBe(false); // déjà de face : rien à redessiner
  });

  it('limite l’inclinaison pour ne pas passer par-dessus le modèle', () => {
    const view = { yaw: 0, pitch: 1.2 };
    takeRotation({ theta: 0, phi: Math.PI / 2 - 1 }, view);
    expect(view.pitch).toBe(1.3);
  });

  it('propose le Prisme et l’Infini, chacun avec son fichier .glb', () => {
    expect(MODELS.map((m) => m.name)).toEqual(['Prisme (modèle 3D)', 'Infini (modèle 3D)']);
    for (const model of MODELS) expect(model.url).toMatch(/\.glb/);
  });
});

// Trame : points (x, y) et tailles ; taille 0 = pastille invisible.
const dots = (list: [number, number, number][]) => ({
  px: Float32Array.from(list.map((d) => d[0])),
  py: Float32Array.from(list.map((d) => d[1])),
  ps: Float32Array.from(list.map((d) => d[2])),
  pd: Float32Array.from(list.map((d) => d[2])),
});
const slotOf = (set: ReturnType<typeof dots>, x: number, y: number) =>
  [...set.px].findIndex((px, k) => px === x && set.py[k] === y && set.ps[k] > 0);

describe('illustrations en 3D : la trame ne tremble pas', () => {
  it('garde la première trame du moteur telle quelle', () => {
    const set = dots([
      [1, 1, 0.5],
      [2, 2, 0.5],
      [9, 9, 0],
    ]);
    keepSlots(set, new Map());
    expect([...set.px]).toEqual([1, 2, 9]);
  });

  it('chaque point garde sa pastille quand le moteur rebat la trame', () => {
    const slots = new Map<string, number>();
    keepSlots(
      dots([
        [1, 1, 0.5],
        [2, 2, 0.5],
        [3, 3, 0.5],
        [9, 9, 0],
      ]),
      slots,
    );
    // nouvelle vue : le moteur a tout mélangé, (1,1) a disparu et (4,4) est apparu
    const next = dots([
      [4, 4, 0.6],
      [3, 3, 0.7],
      [8, 8, 0],
      [2, 2, 0.4],
    ]);
    keepSlots(next, slots);
    expect(slotOf(next, 2, 2)).toBe(1);
    expect(slotOf(next, 3, 3)).toBe(2);
    expect(next.ps[2]).toBeCloseTo(0.7); // la taille suit la nouvelle vue
    expect(slotOf(next, 4, 4)).toBe(0); // place libérée par (1,1)
    expect(next.ps[3]).toBe(0); // la pastille invisible reste invisible
  });
});
