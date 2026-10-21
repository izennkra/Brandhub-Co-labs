import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

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
