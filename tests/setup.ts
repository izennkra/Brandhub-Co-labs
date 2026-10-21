import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom n'a pas de WebGL : dans les tests unitaires, le moteur est remplacé par une doublure
// (les fonctions de la couche d'adaptation, elles, restent les vraies). Le vrai moteur est testé
// dans le navigateur (e2e).
vi.mock('../src/lib/pattern-engine/createEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/pattern-engine/createEngine')>();
  const { CONTROLS } = await import('../src/lib/pattern-engine/controls');
  const canvas = document.createElement('canvas');
  canvas.id = 'scene';
  // Réglages de départ : borne basse, interrupteur éteint, premier choix ; Membrane comme à l'ouverture.
  const S: Record<string, unknown> = Object.fromEntries(
    CONTROLS.map((c) => [
      c.key,
      c.kind === 'slider' ? c.min : c.kind === 'toggle' ? false : c.options[0].value,
    ]),
  );
  S.qStruct = 1;
  S.bg = 'brun';
  S.dots = new Set(['orange']);
  const PALETTE = [
    { id: 'brun', name: 'Brun', hex: '#431604' },
    { id: 'orange', name: 'Orange', hex: '#EC5F14' },
    { id: 'lin', name: 'Lin', hex: '#F1E2DA' },
  ];
  const notify = () => actual.engineEvents.dispatchEvent(new Event('settings'));
  const fakeEngine = {
    core: { S, PALETTE },
    actions: {
      setApp: (mode: string) => {
        S.app = mode;
      },
      setBackground: (id: string) => {
        S.bg = id;
        notify();
      },
      toggleDot: (id: string) => {
        const dots = S.dots as Set<string>;
        if (dots.has(id)) {
          if (dots.size > 1) dots.delete(id);
        } else dots.add(id);
        notify();
      },
      change: (key: string, value: unknown) => {
        S[key] = value;
        actual.engineEvents.dispatchEvent(new Event('settings'));
      },
    },
    attach: (host: HTMLElement) => host.append(canvas),
    detach: (host: HTMLElement) => canvas.parentElement === host && canvas.remove(),
  };
  return { ...actual, getEngine: () => Promise.resolve(fakeEngine) };
});

// jsdom ne connaît pas matchMedia : on simule la largeur d'écran (large par défaut).
let narrowScreen = false;
export function simulateNarrowScreen(value = true) {
  narrowScreen = value;
}
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: narrowScreen,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
  narrowScreen = false;
});
