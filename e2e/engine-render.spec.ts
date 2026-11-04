import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Browser, type Page } from '@playwright/test';

// Preuve du rendu identique (README, « Moteur de patterns ») : le prototype et l'appli tournent
// côte à côte avec le même hasard, une horloge figée et la même taille de scène, puis on compare
// les pixels. Le prototype n'est pas modifié : seuls Three.js (servi depuis node_modules, version
// identique) et la page de test l'entourent.
const ROOT = join(import.meta.dirname, '..');
const PROTOTYPE_URL = 'file://' + join(ROOT, 'reference', 'prototype.html');
const THREE_R128 = readFileSync(join(ROOT, 'node_modules', 'three', 'build', 'three.min.js'), 'utf8');
const SEED = 20261021;
const SIZE = { width: 800, height: 600 };
const MAX_DIFF_RATIO = 0.001; // 0,1 %

// Même graine et même scène des deux côtés. La graine est réappliquée juste avant le moteur :
// dans l'appli par le point d'accroche de createEngine, dans le prototype juste après Three.js.
const setup = ({ seed, width, height }: { seed: number; width: number; height: number }) => {
  let state = seed;
  const random = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Math.random = random;
  // Test seulement, des deux côtés : WebGL garde sa dernière image, qu'on lit directement dans le
  // canvas (sans passer par la capture d'écran, sensible à la charge). Le dessin n'en change pas.
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    options?: object,
  ) {
    const keep = type.startsWith('webgl') ? { ...options, preserveDrawingBuffer: true } : options;
    return getContext.call(this, type, keep);
  } as typeof getContext;
  const w = window as unknown as Record<string, unknown>;
  w.__reseed = () => {
    state = seed;
  };
  w.__engineTestHooks = {
    beforeStart: () => (w.__reseed as () => void)(),
    noModels: true, // le prototype n'a pas les modèles 3D
    onReady: (engine: unknown) => {
      w.__engine = engine;
    },
  };
  const style = document.createElement('style');
  style.textContent = `
    html, body { background: #000 !important; }
    body * { visibility: hidden !important; }
    #scene { visibility: visible !important; position: fixed !important; left: 0 !important; top: 0 !important;
      width: ${width}px !important; height: ${height}px !important; border-radius: 0 !important; z-index: 2147483647 !important; }`;
  const addStyle = () => document.head.appendChild(style);
  if (document.head) addStyle();
  else document.addEventListener('DOMContentLoaded', addStyle);
};

async function openPage(browser: Browser, url: string, prototype: boolean): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(setup, { seed: SEED, ...SIZE });
  if (prototype) {
    await page.route('**/three.min.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: THREE_R128 + '\n;window.__reseed();' }),
    );
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  }
  await page.goto(url);
  if (prototype) await page.waitForFunction(() => document.readyState === 'complete');
  else await page.waitForFunction(() => '__engine' in window, undefined, { timeout: 20000 });
  // Au premier lancement, le moteur range les 3 images de démo dans sa bibliothèque (loadLibrary),
  // en tâche de fond, et tire un nombre au hasard par image : on attend la fin des deux côtés.
  await page.waitForFunction(() => {
    try {
      return Object.keys(JSON.parse(localStorage.getItem('bhc.store.images') ?? '{}')).length >= 3;
    } catch {
      return false;
    }
  });
  // La scène a pris sa taille de test et le moteur s'est redimensionné (ResizeObserver).
  await page.waitForFunction(({ width, height }) => {
    const scene = document.getElementById('scene') as HTMLCanvasElement | null;
    return scene?.width === width && scene?.height === height;
  }, SIZE);
  return page;
}

async function capture(page: Page) {
  await page.clock.runFor(2000);
  const dataUrl = await page.evaluate(() =>
    (document.getElementById('scene') as HTMLCanvasElement).toDataURL(),
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function diffRatio(browser: Browser, a: Buffer, b: Buffer) {
  const page = await browser.newPage();
  const ratio = await page.evaluate(
    async ([first, second]) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = src;
        });
      const pixels = async (src: string) => {
        const image = await load(src);
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, image.width, image.height).data;
      };
      const [pa, pb] = await Promise.all([pixels(first), pixels(second)]);
      let different = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const delta = Math.max(
          Math.abs(pa[i] - pb[i]),
          Math.abs(pa[i + 1] - pb[i + 1]),
          Math.abs(pa[i + 2] - pb[i + 2]),
        );
        if (delta > 24) different++;
      }
      return different / (pa.length / 4);
    },
    [a, b].map((buffer) => 'data:image/png;base64,' + buffer.toString('base64')),
  );
  await page.close();
  return ratio;
}

type Case = {
  name: string;
  app: (page: Page) => Promise<void>;
  prototype: (page: Page) => Promise<void>;
};

const clickPrototypeButton = (label: string) => (page: Page) =>
  page.evaluate((text) => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('#controls button')].find(
      (candidate) => candidate.textContent === text,
    );
    if (!button) throw new Error(`Bouton « ${text} » introuvable dans le prototype`);
    button.click();
  }, label);

const CASES: Case[] = [
  { name: 'Quantique › Membrane › Nœud (ouverture)', app: async () => {}, prototype: async () => {} },
  {
    name: 'Quantique › Ligne',
    app: (page) => page.evaluate(() => (window as any).__engine.actions.setStructure(2)), // eslint-disable-line @typescript-eslint/no-explicit-any
    prototype: clickPrototypeButton('Ligne'),
  },
  {
    name: 'Quantique › Membrane › Simple (nouveau tirage)',
    app: (page) => page.evaluate(() => (window as any).__engine.actions.setShape(2)), // eslint-disable-line @typescript-eslint/no-explicit-any
    prototype: clickPrototypeButton('Simple'),
  },
  {
    name: 'Illustration (images de démo)',
    app: (page) => page.evaluate(() => (window as any).__engine.actions.setApp('image')), // eslint-disable-line @typescript-eslint/no-explicit-any
    prototype: (page) =>
      page.evaluate(() =>
        document.querySelector<HTMLButtonElement>('#appSwitch button[data-app="image"]')!.click(),
      ),
  },
];

test.describe('rendu identique au prototype', () => {
  test.describe.configure({ timeout: 90000 });

  for (const testCase of CASES) {
    test(testCase.name, async ({ browser }, testInfo) => {
      const app = await openPage(browser, '/outils/motif', false);
      const prototype = await openPage(browser, PROTOTYPE_URL, true);
      // Le moteur tire au hasard à chaque image (renflements) et en rangeant les images de démo :
      // l'ordre de ces tirages dépend de la vitesse de la machine. On repart du même hasard des
      // deux côtés juste avant le cas testé.
      for (const page of [app, prototype]) await page.evaluate(() => (window as any).__reseed()); // eslint-disable-line @typescript-eslint/no-explicit-any
      await testCase.app(app);
      await testCase.prototype(prototype);

      const [appImage, prototypeImage] = [await capture(app), await capture(prototype)];
      writeFileSync(testInfo.outputPath('appli.png'), appImage);
      writeFileSync(testInfo.outputPath('prototype.png'), prototypeImage);
      const ratio = await diffRatio(browser, appImage, prototypeImage);
      expect(ratio, `${(ratio * 100).toFixed(3)} % de pixels différents`).toBeLessThanOrEqual(MAX_DIFF_RATIO);
      await app.close();
      await prototype.close();
    });
  }

  test('détecte une différence de réglage d’un seul côté', async ({ browser }) => {
    const app = await openPage(browser, '/outils/motif', false);
    const prototype = await openPage(browser, PROTOTYPE_URL, true);
    await app.evaluate(() => {
      const engine = (window as any).__engine; // eslint-disable-line @typescript-eslint/no-explicit-any
      engine.core.S.lobes = 7;
      engine.core.regenerate();
    });
    const ratio = await diffRatio(browser, await capture(app), await capture(prototype));
    expect(ratio).toBeGreaterThan(MAX_DIFF_RATIO);
    await app.close();
    await prototype.close();
  });
});
