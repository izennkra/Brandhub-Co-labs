import { describe, expect, it } from 'vitest';
import {
  FORMES,
  isTransparent,
  LIVE_KEYS,
  NOT_WIDENED,
  readAxes,
  readFormat,
  readSettings,
} from '../src/embed/settings';

// Attributs de <colabs-motif> (script d'intégration sur un site) → réglages du moteur.
const settings = (attrs: Record<string, string> = {}) => readSettings((name) => attrs[name] ?? null);

describe('script d’intégration : réglages du motif', () => {
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

describe('script d’intégration : fond transparent et format', () => {
  const read = (attrs: Record<string, string>) => (name: string) => attrs[name] ?? null;

  it('fond transparent : reconnu, sans changer la couleur du moteur', () => {
    expect(isTransparent(read({ fond: 'Transparent' }))).toBe(true);
    expect(isTransparent(read({ fond: 'lin' }))).toBe(false);
    expect(settings({ fond: 'transparent' }).bg).toBe('lin');
  });

  it('format : 16/9, 1:1, 4x5 → aspect-ratio CSS ; le reste est ignoré', () => {
    expect(readFormat('16/9')).toBe('16 / 9');
    expect(readFormat(' 1:1 ')).toBe('1 / 1');
    expect(readFormat('4x5')).toBe('4 / 5');
    expect(readFormat('2,35/1')).toBe('2.35 / 1');
    expect(readFormat('carré')).toBeNull();
    expect(readFormat('0/9')).toBeNull();
    expect(readFormat(null)).toBeNull();
  });
});

describe('script d’intégration : axes X, Y, Z et réglages en direct', () => {
  const read = (attrs: Record<string, string>) => (name: string) => attrs[name] ?? null;

  it('axes en degrés → radians, 0 par défaut, bornés à ±360', () => {
    const [x, y, z] = readAxes(read({ 'axe-x': '90', 'axe-z': '-45' }));
    expect(x).toBeCloseTo(Math.PI / 2);
    expect(y).toBe(0);
    expect(z).toBeCloseTo(-Math.PI / 4);
    expect(readAxes(read({ 'axe-y': '999' }))[1]).toBeCloseTo(2 * Math.PI);
  });

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
