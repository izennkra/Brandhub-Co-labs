import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PresetList } from '../src/components/engine/PresetList';
import { createPresets, fmtDate, slugName } from '../src/lib/pattern-engine/presets';
import type { PrototypeEngine } from '../src/lib/pattern-engine/prototype-engine.js';
import { createStore } from '../src/lib/store/store';

// Moteur simulé : réglages, vue et Store du navigateur (le module de l'appli, mêmes clés que le moteur).
function setup(S: Record<string, unknown> = {}) {
  const store = Object.assign(createStore({ fetch: () => Promise.reject(new Error('hors ligne')) }), {
    readOnly: false,
  });
  const core = {
    S: {
      app: 'motif',
      variant: 2,
      qStruct: 1,
      bg: 'brun',
      dots: new Set(['orange']),
      paused: true,
      fog: 0,
      pinches: 0,
      ...S,
    },
    orbit: { theta: 0.5, phi: 1.25, radius: 58 },
    Store: store,
    storeReady: store.ready,
    mulberry32: () => () => 0.5,
    regenerate: vi.fn(),
    resetView: vi.fn(),
    refreshColors: vi.fn(),
  } as unknown as PrototypeEngine & { S: Record<string, unknown> };
  const toasts: string[] = [];
  const setApp = vi.fn((mode: string) => (core.S.app = mode));
  const presets = createPresets(
    core,
    { setApp },
    () => {},
    (m) => toasts.push(m),
    () => {},
  );
  return { core, presets, toasts, setApp, store };
}
const saved = () => JSON.parse(localStorage.getItem('bhc.store.presets') || '{}');

describe('préréglages partagés (recopiés du prototype)', () => {
  it('slugName et fmtDate donnent les mêmes résultats que le prototype', () => {
    expect(slugName('  Été Brûlant !! ')).toBe('ete-brulant');
    expect(slugName('***')).toBe('preset');
    expect(slugName('a'.repeat(80))).toHaveLength(60);
    expect(fmtDate({ id: 'x', name: 'x', t: Date.UTC(2026, 9, 22, 12), s: { app: 'image' } })).toBe(
      '22 oct. · Illustration',
    );
    expect(
      fmtDate({ id: 'x', name: 'x', t: Date.UTC(2026, 9, 22, 12), s: { app: 'motif', variant: 2 } }),
    ).toBe('22 oct. · Quantique');
  });

  it('enregistre les réglages (sans pause, brouillard ni pincements) et la vue', async () => {
    const { presets, toasts } = setup({ density: 3 });
    await presets.init();
    expect(await presets.save('  Doux  ')).toBe(true);
    const doc = saved().doux;
    expect(doc.name).toBe('Doux');
    expect(doc.s).toMatchObject({
      app: 'motif',
      density: 3,
      dots: ['orange'],
      _view: { theta: 0.5, phi: 1.25, radius: 58 },
    });
    expect(doc.s).not.toHaveProperty('paused');
    expect(doc.s).not.toHaveProperty('fog');
    expect(toasts.at(-1)).toBe('Préréglage enregistré : Doux');
    expect(presets.list().map((p) => p.name)).toEqual(['Doux']);
  });

  it('nomme « Préréglage N » sans nom, coupe à 40 caractères et met à jour un nom existant', async () => {
    const { presets, toasts } = setup();
    await presets.init();
    await presets.save('');
    await presets.save('');
    await presets.save('x'.repeat(50));
    await presets.save('Préréglage 1');
    expect(presets.list().map((p) => p.name)).toEqual(['x'.repeat(40), 'Préréglage 2', 'Préréglage 1']); // mis à jour sur place, comme le prototype;
    expect(toasts.at(-1)).toBe('Préréglage mis à jour : Préréglage 1');
  });

  it('applique un préréglage : réglages, couleurs, vue, et ignore la pause', async () => {
    const { core, presets, toasts } = setup();
    localStorage.setItem(
      'bhc.store.presets',
      JSON.stringify({
        vif: {
          name: 'Vif',
          t: 1,
          s: {
            app: 'motif',
            density: 9,
            dots: ['lin', 'orange'],
            paused: false,
            fog: 1,
            variant: 0,
            _view: { theta: 1, phi: 2, radius: 30 },
          },
        },
      }),
    );
    await presets.init();
    presets.apply('vif');
    expect(core.S.density).toBeUndefined(); // réglage inconnu du moteur : ignoré, comme le prototype
    expect(core.S.dots).toEqual(new Set(['lin', 'orange']));
    expect(core.S).toMatchObject({ paused: true, fog: 0, variant: 2 });
    expect(core.orbit).toEqual({ theta: 1, phi: 2, radius: 30 });
    expect(core.regenerate).toHaveBeenCalled();
    expect(toasts.at(-1)).toBe('Préréglage appliqué : Vif');
  });

  it('ne montre que les préréglages de l’outil affiché, du plus récent au plus ancien', async () => {
    const { core, presets } = setup();
    localStorage.setItem(
      'bhc.store.presets',
      JSON.stringify({
        a: { name: 'A', t: 1, s: { app: 'motif' } },
        b: { name: 'B', t: 3, s: { app: 'motif' } },
        c: { name: 'C', t: 2, s: { app: 'image' } },
        d: { name: 'Sans réglages', t: 4 },
      }),
    );
    await presets.init();
    expect(presets.list().map((p) => p.name)).toEqual(['B', 'A']);
    core.S.app = 'image';
    expect(presets.list().map((p) => p.name)).toEqual(['C']);
  });

  it('étoile : ouvert au démarrage sur cet appareil, appliqué quand son outil s’ouvre', async () => {
    const first = setup();
    localStorage.setItem(
      'bhc.store.presets',
      JSON.stringify({ illu: { name: 'Illu', t: 1, s: { app: 'image', imgBright: 4 } } }),
    );
    await first.presets.init();
    first.core.S.app = 'image';
    first.presets.toggleDefault('illu');
    expect(localStorage.getItem('bhc.presetDefault')).toBe('illu');
    expect(first.presets.defaultId).toBe('illu');

    // Nouvelle visite, sur la page Motif : rien ne change tant qu'on n'ouvre pas l'Illustration.
    const next = setup({ imgBright: 0 });
    await next.presets.init();
    expect(next.setApp).not.toHaveBeenCalled();
    expect(next.core.S.imgBright).toBe(0);
    next.core.S.app = 'image';
    next.presets.onAppChanged();
    expect(next.core.S.imgBright).toBe(4);
    expect(next.toasts.at(-1)).toBe('Préréglage ouvert : Illu');

    next.presets.toggleDefault('illu');
    expect(localStorage.getItem('bhc.presetDefault')).toBeNull();
  });

  it('supprime un préréglage pour tout le monde', async () => {
    const { presets, toasts } = setup();
    await presets.init();
    await presets.save('Doux');
    await presets.remove('doux');
    expect(saved()).toEqual({});
    expect(presets.list()).toEqual([]);
    expect(toasts.at(-1)).toBe('Préréglage supprimé.');
  });

  it('explique où sont les préréglages', async () => {
    const { presets } = setup();
    expect(presets.note()).toBe('Chargement des préréglages…');
    await presets.init();
    expect(presets.note()).toMatch(/^Enregistrés dans ce navigateur seulement/);
  });
});

describe('PresetList (panneau)', () => {
  const PRESETS = [
    { id: 'doux', name: 'Doux', detail: '22 oct. · Quantique' },
    { id: 'vif', name: 'Vif', detail: '21 oct. · Quantique' },
  ];
  function renderList(defaultId: string | null = null) {
    const calls: string[] = [];
    render(
      <PresetList
        presets={PRESETS}
        defaultId={defaultId}
        note="Note"
        onSave={async (name) => (calls.push(`enregistre:${name}`), true)}
        onApply={(id) => calls.push(`applique:${id}`)}
        onToggleDefault={(id) => calls.push(`étoile:${id}`)}
        onDelete={(id) => calls.push(`supprime:${id}`)}
      />,
    );
    return calls;
  }

  it('enregistre avec le bouton ou la touche Entrée, puis vide le champ', async () => {
    const user = userEvent.setup();
    const calls = renderList();
    const input = screen.getByRole('textbox', { name: 'Nom du préréglage' });
    expect(input).toHaveAttribute('maxlength', '40');
    await user.type(input, 'Doux{Enter}');
    expect(input).toHaveValue('');
    await user.type(input, 'Vif');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(calls).toEqual(['enregistre:Doux', 'enregistre:Vif']);
  });

  it('applique, choisit l’étoile et supprime en deux temps', async () => {
    const user = userEvent.setup();
    const calls = renderList('vif');
    const items = within(screen.getByRole('list', { name: 'Préréglages' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /^Doux/ }));
    expect(screen.getByRole('button', { name: 'Ne plus ouvrir par défaut Vif' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Ouvrir par défaut avec Doux' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer Vif' }));
    expect(calls).toEqual(['applique:doux', 'étoile:doux']);
    await user.click(screen.getByRole('button', { name: 'Confirmer la suppression de Vif' }));
    expect(calls).toEqual(['applique:doux', 'étoile:doux', 'supprime:vif']);
  });

  it('invite à créer un préréglage quand la liste est vide', () => {
    render(
      <PresetList
        presets={[]}
        defaultId={null}
        note="Note"
        onSave={async () => true}
        onApply={() => {}}
        onToggleDefault={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText(/Aucun préréglage pour l’instant/)).toBeInTheDocument();
  });
});
