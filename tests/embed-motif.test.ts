import { describe, expect, it } from 'vitest';
import { FORMES, LIVE_KEYS, NOT_WIDENED, readMotifSettings } from '../src/embed/motif/settings';

// Attributs de <colabs-motif> (script d'intégration sur un site) → réglages du moteur.
const settings = (attrs: Record<string, string> = {}) => readMotifSettings((name) => attrs[name] ?? null);

describe('motif : réglages', () => {
  it('par défaut : forme A, son tirage et son orientation, fond lin, points brun ciel lin', () => {
    const o = settings();
    expect(o._seed).toEqual(FORMES.A.tirage);
    expect(o.shapeMode).toBe(1);
    expect(o.fov).toBe(36);
    expect(o._view).toEqual(FORMES.A.view);
    expect(o.bg).toBe('lin');
    expect(o.dots).toEqual(['brun', 'ciel', 'lin']);
  });

  it('choisit la forme B, ou une graine précise (forme exacte)', () => {
    expect(settings({ forme: 'b' })._seed).toEqual(FORMES.B.tirage);
    expect(settings({ forme: 'b' })._view).toEqual(FORMES.B.view);
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

  it('fond transparent : la couleur du moteur ne change pas (la transparence est gérée à part)', () => {
    expect(settings({ fond: 'transparent' }).bg).toBe('lin');
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

describe('motif : réglages appliqués en direct', () => {
  it('orientation et couleurs ne font pas partie de la forme (pas de nouveau dessin)', () => {
    const shape = (attrs: Record<string, string>) => {
      const rest = settings(attrs);
      delete rest._view;
      for (const key of LIVE_KEYS) delete rest[key];
      return JSON.stringify(rest);
    };
    const base = shape({});
    expect(shape({ rotation: '40', inclinaison: '20', distance: '90' })).toBe(base);
    expect(shape({ couleurs: 'orange', fond: 'brun', survol: 'non', 'rotation-auto': 'non' })).toBe(base);
    expect(shape({ 'axe-x': '30' })).toBe(base);
    // la forme, elle, change
    expect(shape({ forme: 'B' })).not.toBe(base);
    expect(shape({ renflements: '6' })).not.toBe(base);
  });
});

describe('motif : réglages du survol', () => {
  it('survol détaillé : zone, taille, force, ouverture, reconstruction (bornés)', () => {
    expect(
      settings({
        'survol-zone': 'forme',
        'survol-taille': '900',
        'survol-force': '2,5',
        'survol-ouverture': '0.5',
        'survol-reconstruction': '3',
      }),
    ).toMatchObject({ hoverMode: 1, hoverRadius: 500, hoverForce: 2.5, hoverIn: 0.5, hoverOut: 3 });
    expect(settings({ 'survol-zone': 'curseur' }).hoverMode).toBe(0);
    expect(settings({ 'survol-zone': 'partout' }).hoverMode).toBeUndefined();
  });

  it('survol désactivable, et ses réglages ne redessinent pas la forme', () => {
    expect(settings({ survol: 'non' }).hoverOn).toBe(false);
    for (const key of ['hoverOn', 'hoverMode', 'hoverRadius', 'hoverForce', 'hoverIn', 'hoverOut'])
      expect(LIVE_KEYS).toContain(key);
  });
});
