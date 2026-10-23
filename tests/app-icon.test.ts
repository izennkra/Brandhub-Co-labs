import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Icône de l'appli (onglet du navigateur, Safari, écran d'accueil du téléphone) : chaque lien de
// index.html pointe vers un fichier présent dans public/.
const html = readFileSync('index.html', 'utf8');
const links = [...html.matchAll(/<link rel="(icon|apple-touch-icon)" href="\/([^"]+)"/g)];

describe('icône de l’appli', () => {
  it('déclare l’icône SVG, la version PNG et l’icône d’écran d’accueil', () => {
    expect(links.map(([, rel, file]) => `${rel} ${file}`)).toEqual([
      'icon favicon.svg',
      'icon favicon-32.png',
      'apple-touch-icon apple-touch-icon.png',
    ]);
  });

  it('chaque fichier d’icône existe', () => {
    for (const [, , file] of links) expect(existsSync(`public/${file}`), file).toBe(true);
  });

  it('l’icône SVG est bien le symbole Co-labs (fond clair, motif brun)', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8');
    expect(svg).toContain('fill="#EBE5E0"');
    expect(svg).toContain('fill="#431603"');
  });
});
