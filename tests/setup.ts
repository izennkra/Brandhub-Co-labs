import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom n'a pas de WebGL : dans les tests unitaires, le moteur est remplacé par une doublure
// (les fonctions de la couche d'adaptation, elles, restent les vraies). Le vrai moteur est testé
// dans le navigateur (e2e).
vi.mock('../src/lib/pattern-engine/createEngine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/pattern-engine/createEngine')>();
  const canvas = document.createElement('canvas');
  canvas.id = 'scene';
  const fakeEngine = {
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
  narrowScreen = false;
});
