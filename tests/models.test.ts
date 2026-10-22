import { describe, expect, it } from 'vitest';
import { MODELS, takeRotation } from '../src/lib/pattern-engine/models';

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
