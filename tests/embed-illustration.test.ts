import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TONE,
  libraryDocuments,
  pickIllustrations,
  readDistance,
  readOverrides,
  readPlayback,
  startIndex,
  type Illustration,
} from '../src/embed/illustrationSettings';
import { getStore, openStore, seedStore } from '../src/embed/memoryStore';

// Script d'intégration des illustrations (<colabs-illustration>) : réglages, liste, stockage en mémoire.
const read = (attrs: Record<string, string>) => (name: string) => attrs[name] ?? null;

const LIST: Illustration[] = [
  { id: 'prisme', nom: 'Prisme', fichier: 'prisme.jpg', tons: { imgContr: 12 }, reglages: { bg: 'taupe' } },
  { id: 'adn', nom: 'ADN', fichier: 'adn.jpg', reglages: { bg: 'lin' } },
  { id: 'microscope', nom: 'Microscope', fichier: 'microscope.jpg' },
];

describe('illustrations : liste, départ, lecture', () => {
  it('garde les illustrations demandées, dans l’ordre demandé (inconnues ignorées)', () => {
    expect(pickIllustrations(LIST, 'adn, prisme inconnue').map((i) => i.id)).toEqual(['adn', 'prisme']);
    expect(pickIllustrations(LIST, null)).toHaveLength(3);
  });

  it('départ : identifiant ou numéro, sinon la première', () => {
    expect(startIndex(LIST, 'adn')).toBe(1);
    expect(startIndex(LIST, '2')).toBe(2);
    expect(startIndex(LIST, '9')).toBe(0);
    expect(startIndex(LIST, null)).toBe(0);
  });

  it('lecture : durée bornée, automatique par défaut, manuelle sur demande, boucle', () => {
    expect(readPlayback(read({}))).toEqual({ duree: 6, transition: undefined, auto: true, boucle: true });
    expect(readPlayback(read({ duree: '0', lecture: 'manuelle', boucle: 'non', transition: '1,5' }))).toEqual(
      {
        duree: 1,
        transition: 1.5,
        auto: false,
        boucle: false,
      },
    );
  });

  it('réglages imposés : seulement ceux donnés (fond, couleurs, survol, JSON)', () => {
    expect(readOverrides(read({}))).toEqual({});
    expect(
      readOverrides(read({ fond: 'brun', couleurs: 'lin', survol: 'non', reglages: '{"imgCols":150}' })),
    ).toEqual({ bg: 'brun', dots: ['lin'], hoverOn: false, imgCols: 150 });
    // fond transparent : géré à part (shared.ts), pas une couleur du moteur
    expect(readOverrides(read({ fond: 'transparent' }))).toEqual({});
  });
});

describe('illustrations : même taille pour toutes', () => {
  it('le cadrage enregistré dans l’outil (_view) n’est pas repris', () => {
    const list: Illustration[] = [
      { id: 'a', nom: 'A', fichier: 'a.jpg', reglages: { bg: 'lin', _view: { radius: 132 } } },
    ];
    const s = (libraryDocuments(list, ['data:a']).imgsettings.a as { s: Record<string, unknown> }).s;
    expect(s._view).toBeUndefined();
    expect(s.bg).toBe('lin');
  });

  it('distance commune : 74 par défaut (cadrage du moteur), bornée de 5 à 180', () => {
    expect(readDistance(read({}))).toBe(74);
    expect(readDistance(read({ distance: '90' }))).toBe(90);
    expect(readDistance(read({ distance: '999' }))).toBe(180);
  });
});

describe('illustrations : bibliothèque et stockage en mémoire', () => {
  it('documents au format de la bibliothèque de l’outil (nom, tons, ordre, image, réglages)', () => {
    const docs = libraryDocuments(LIST, ['data:a', 'data:b', 'data:c']);
    expect(docs.images.prisme).toEqual({
      name: 'Prisme',
      tone: { ...DEFAULT_TONE, imgContr: 12 },
      inLoop: true,
      t: 1,
    });
    expect(docs.imagesrc.adn).toEqual({ src: 'data:b' });
    expect(docs.imgsettings.adn).toEqual({ s: { bg: 'lin', app: 'image' } });
    // image ajoutée sans réglages : ceux de la première illustration, tons par défaut
    expect(docs.imgsettings.microscope).toEqual({ s: { bg: 'taupe', app: 'image' } });
    expect((docs.images.microscope as { tone: unknown }).tone).toEqual(DEFAULT_TONE);
  });

  it('stockage en mémoire : lecture après ouverture, écritures gardées en mémoire', async () => {
    seedStore({ images: { a: { name: 'A' } } });
    const store = getStore();
    let read = false;
    const listed = store.list('images').then((items) => ((read = true), items));
    await Promise.resolve();
    expect(read).toBe(false); // pas encore ouvert : la bibliothèque attend
    openStore();
    expect(await listed).toEqual([{ id: 'a', data: { name: 'A' } }]);
    await store.put('images', 'b', { name: 'B' });
    expect(await store.get('images', 'b')).toEqual({ name: 'B' });
    await store.del('images', 'a');
    expect(await store.get('images', 'a')).toBeNull();
    expect(localStorage.length).toBe(0); // rien d'écrit chez le visiteur
  });
});
