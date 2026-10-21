import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /engine-render\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    // Rendu identique au prototype : comparaison au pixel, sensible à la charge de la machine.
    // Il tourne après les autres tests, un test à la fois. Le prototype lui-même varie parfois
    // légèrement d'une exécution à l'autre en mode Ligne (jusqu'à 0,25 %) : une comparaison qui
    // dépasse le seuil est rejouée (jusqu'à 2 fois). Un vrai écart, lui, échoue à chaque fois.
    {
      name: 'rendu-identique',
      testMatch: /engine-render\.spec\.ts/,
      dependencies: ['chromium'],
      fullyParallel: false,
      retries: 2,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
