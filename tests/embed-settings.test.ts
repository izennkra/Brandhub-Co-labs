import { describe, expect, it } from 'vitest';
import { FORMES, NOT_WIDENED, readSettings } from '../src/embed/settings';

// Attributs de <colabs-motif> (script d'intégration sur un site) → réglages du moteur.
const settings = (attrs: Record<string, string> = {}) => readSettings((name) => attrs[name] ?? null);

describe('script d’intégration : réglages du motif', () => {
  it('par défaut : forme A, sa graine et son orientation, fond lin, points brun ciel lin', () => {
    const o = settings();
    expect(o._seed).toBe(FORMES.A.graine);
    expect(o.shapeMode).toBe(0);
    expect(o._view).toEqual(FORMES.A.view);
    expect(o.bg).toBe('lin');
    expect(o.dots).toEqual(['brun', 'ciel', 'lin']);
  });

  it('choisit la forme B, ou une graine précise (forme exacte)', () => {
    expect(settings({ forme: 'b' })._seed).toBe(FORMES.B.graine);
    expect(settings({ forme: 'B' }).shapeMode).toBe(1);
    expect(settings({ forme: 'B', graine: '714171450' })._seed).toBe(714171450);
    expect(settings({ 'forme-du-fil': 'simple' }).shapeMode).toBe(2);
  });

  it('orientation en degrés : rotation, inclinaison (0 = de face), distance', () => {
    const view = settings({ rotation: '90', inclinaison: '0', distance: '50' })._view as Record<
      string,
      number
    >;
    expect(view.theta).toBeCloseTo(Math.PI / 2);
    expect(view.phi).toBeCloseTo(Math.PI / 2);
    expect(view.radius).toBe(50);
    // valeurs hors bornes ramenées dans celles du moteur
    expect((settings({ distance: '999' })._view as Record<string, number>).radius).toBe(180);
    expect(settings({ 'rotation-auto': 'non', 'vitesse-rotation': '9' })).toMatchObject({
      autoRotate: false,
      rotSpeed: 4,
    });
  });

  it('élargir : réglages des renflements, ou ruban régulier avec « non »', () => {
    expect(
      settings({ renflements: '5', gonflement: '1,2', 'finesse-cols': '0.1', epaisseur: '2' }),
    ).toMatchObject({ lobes: 5, junction: 1.2, thin: 0.1, tubeR: 2 });
    expect(settings({ elargir: 'non', gonflement: '1.9' })).toMatchObject(NOT_WIDENED);
    expect(settings({ elargir: 'oui' }).junction).toBeUndefined();
  });

  it('couleurs, survol, particules et réglages avancés', () => {
    expect(settings({ fond: 'Brun', couleurs: 'orange, sauge inconnue' })).toMatchObject({
      bg: 'brun',
      dots: ['orange', 'sauge'],
    });
    expect(settings({ survol: 'non', particules: '50000' })).toMatchObject({ hoverOn: false, qCount: 50000 });
    expect(settings({ reglages: '{"swirl":0.4,"twinkle":0}' })).toMatchObject({ swirl: 0.4, twinkle: 0 });
    // réglages illisibles : ignorés, sans erreur
    expect(settings({ reglages: '{pas du json' }).bg).toBe('lin');
  });
});
