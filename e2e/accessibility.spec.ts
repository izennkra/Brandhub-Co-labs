import { expect, test } from '@playwright/test';

const PAGES = [
  '/outils/motif',
  '/outils/illustration',
  '/outils/layout-editor',
  '/ressources/logo',
  '/ressources/typographie',
  '/ressources/couleur',
  '/ressources/iconographie',
  '/ressources/imagerie',
  '/ressources/patterns',
  '/ressources/inspiration',
];

for (const path of PAGES) {
  test(`${path} : tout texte visible respecte le contraste WCAG AA`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);

    const failures = await page.evaluate(() => {
      type RGBA = [number, number, number, number];
      const parse = (value: string): RGBA => {
        const n = value.match(/[\d.]+/g)!.map(Number);
        return [n[0], n[1], n[2], n[3] ?? 1];
      };
      const over = (top: RGBA, bottom: RGBA): RGBA => {
        const a = top[3] + bottom[3] * (1 - top[3]);
        return [0, 1, 2]
          .map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a)
          .concat(a) as RGBA;
      };
      const background = (el: Element): RGBA => {
        const layers: RGBA[] = [];
        for (let node: Element | null = el; node; node = node.parentElement) {
          const bg = parse(getComputedStyle(node).backgroundColor);
          if (bg[3] > 0) layers.push(bg);
          if (bg[3] === 1) break;
        }
        return layers.reverse().reduce((acc, layer) => over(layer, acc), [255, 255, 255, 1] as RGBA);
      };
      const luminance = ([r, g, b]: RGBA) =>
        [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);

      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const el = text.parentElement!;
        if (!text.textContent!.trim() || el.closest('[aria-disabled="true"], .visually-hidden, title'))
          continue;
        if (!el.checkVisibility()) continue;
        const style = getComputedStyle(el);
        const bg = background(el);
        const fg = over(parse(style.color), bg);
        const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
        const ratio = (hi + 0.05) / (lo + 0.05);
        const large =
          parseFloat(style.fontSize) >= 24 ||
          (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) out.push(`« ${text.textContent!.trim()} » : ${ratio.toFixed(2)}:1`);
      }
      return out;
    });

    expect(failures).toEqual([]);
  });
}

test('chaque élément atteint au clavier montre un contour de focus', async ({ page }) => {
  for (const path of ['/outils/motif', '/ressources/logo']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          id: el.outerHTML.slice(0, 80),
          name: el.getAttribute('aria-label') ?? el.textContent?.trim(),
          outlined: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
        };
      });
      if (!info || seen.has(info.id)) break;
      seen.add(info.id);
      expect(info.outlined, `focus invisible sur « ${info.name} »`).toBe(true);
    }
    expect(seen.size).toBeGreaterThan(5);
  }
});
