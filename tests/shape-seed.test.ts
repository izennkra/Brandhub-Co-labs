import { describe, expect, it, vi } from 'vitest';
import { createPresets } from '../src/lib/pattern-engine/presets';
import type { PrototypeEngine } from '../src/lib/pattern-engine/prototype-engine.js';
import { createShapeSeed } from '../src/lib/pattern-engine/shapeSeed';
import { createStore } from '../src/lib/store/store';

// Moteur simulé : le générateur « rng » renvoie sa graine, pour voir laquelle le moteur a reçue
// au moment de redessiner la forme.
function setup() {
  const store = Object.assign(createStore({ fetch: () => Promise.reject(new Error('hors ligne')) }), {
    readOnly: false,
  });
  const seenAtRegenerate: number[] = [];
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
    },
    orbit: { theta: 0.5, phi: 1.25, radius: 58 },
    Store: store,
    storeReady: store.ready,
    rng: () => -1,
    mulberry32: (seed: number) => () => seed,
    regenerate: vi.fn(() => seenAtRegenerate.push(core.rng())),
    resetView: vi.fn(),
    refreshColors: vi.fn(),
  } as unknown as PrototypeEngine & { S: Record<string, unknown> };
  const shapeSeed = createShapeSeed(core);
  const presets = createPresets(
    core,
    { setApp: vi.fn() },
    () => {},
    () => {},
    () => {},
    { shapeSeed },
  );
  return { core, presets, shapeSeed, seenAtRegenerate };
}

const saved = () => JSON.parse(localStorage.getItem('bhc.store.presets') || '{}');

describe('graine de la forme (forme reproductible)', () => {
  it('passe la graine au moteur et la garde', () => {
    const { core, shapeSeed } = setup();
    expect(shapeSeed.current()).toBeNull();
    shapeSeed.use(1234);
    expect(core.rng()).toBe(1234);
    expect(shapeSeed.current()).toBe(1234);
    const random = shapeSeed.use();
    expect(Number.isInteger(random)).toBe(true);
    expect(shapeSeed.current()).toBe(random);
  });

  it('forme dessinée à la souris : graine inconnue jusqu’à la prochaine nouvelle forme', () => {
    const { core, shapeSeed } = setup();
    shapeSeed.use(42);
    core.S.loopPath = [[0, 0, 0]]; // le moteur vient de prendre le tracé, avec sa propre graine
    expect(shapeSeed.current()).toBeNull();
    shapeSeed.use(43);
    expect(shapeSeed.current()).toBe(43);
  });

  it('le préréglage enregistre la graine et la redonne au moteur : même forme', async () => {
    const { presets, shapeSeed, seenAtRegenerate } = setup();
    await presets.init();
    shapeSeed.use(777);
    expect(await presets.save('Forme A')).toBe(true);
    expect(saved()['forme-a'].s._seed).toBe(777);

    shapeSeed.use(5); // une autre forme s'affiche
    presets.apply('forme-a');
    expect(seenAtRegenerate.at(-1)).toBe(777);
    expect(shapeSeed.current()).toBe(777);
  });

  it('ancien préréglage sans graine : une forme au hasard, comme avant', async () => {
    const { presets, shapeSeed, seenAtRegenerate } = setup();
    await presets.init();
    shapeSeed.use(9);
    await presets.save('Ancien');
    const all = saved();
    delete all.ancien.s._seed;
    localStorage.setItem('bhc.store.presets', JSON.stringify(all));
    await presets.init();
    presets.apply('ancien');
    expect(seenAtRegenerate.at(-1)).not.toBe(9);
    expect(Number.isInteger(seenAtRegenerate.at(-1))).toBe(true);
  });
});
