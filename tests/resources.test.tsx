import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import {
  formatCmyk,
  formatHsl,
  formatRgb,
  hexToOklab,
  isLight,
  neutralScale,
  normalizeHex,
  shadeScale,
  wantsDarkText,
} from '../src/lib/resources/colors';
import { lockEditor } from '../src/lib/resources/editor';
import { iconSvgUrl, variantId } from '../src/lib/resources/icons';
import { logoVariants, recolorSvg, sanitizeSvg } from '../src/lib/resources/logo';
import { nearestPantone } from '../src/lib/resources/pantone';
import { LOCAL_EDITOR_CODE } from '../src/lib/store/store';

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

async function unlock(user = userEvent.setup()) {
  await user.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
  await user.type(screen.getByLabelText('Code'), LOCAL_EDITOR_CODE);
  await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
  await screen.findByRole('heading', { name: 'Mode édition' });
  return user;
}

afterEach(() => act(() => lockEditor()));

describe('calculs de couleur', () => {
  it('normalise un code HEX et calcule RVB et TSL', () => {
    expect(normalizeHex(' ec5f14 ')).toBe('#EC5F14');
    expect(normalizeHex('#e51')).toBe('#EE5511');
    expect(normalizeHex('orange')).toBeNull();
    expect(formatRgb('#EC5F14')).toBe('rgb(236 95 20)');
    expect(formatHsl('#EC5F14')).toBe('hsl(21 85% 50%)');
    expect(isLight('#F1E2DA')).toBe(true);
    expect(isLight('#431604')).toBe(false);
  });

  it('calcule le CMJN et le Pantone le plus proche', () => {
    expect(formatCmyk('#EC5F14')).toBe('C0 M60 J92 N7');
    expect(formatCmyk('#000000')).toBe('C0 M0 J0 N100');
    expect(formatCmyk('#FFFFFF')).toBe('C0 M0 J0 N0');
    // une teinte de la table donne son propre code
    expect(nearestPantone('#DD4F05')).toBe('Pantone 1665 C');
    expect(nearestPantone('#EC5F14')).toMatch(/^Pantone \S+ C$/);
  });
});

describe('neutres et nuances', () => {
  it('construit 11 neutres entre les deux couleurs opposées', () => {
    const scale = neutralScale('#F7F4ED', '#1B1B1B');
    expect(scale.map((s) => s.step)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
    expect(scale[0].hex).toBe('#F7F4ED');
    expect(scale[10].hex).toBe('#1B1B1B');
    expect(isLight(scale[2].hex)).toBe(true);
    expect(isLight(scale[8].hex)).toBe(false);
  });

  it('décline chaque couleur du plus clair au plus foncé, la couleur rangée à son palier', () => {
    const lightness = (hex: string) => hexToOklab(hex)[0];
    const orange = shadeScale('#ec5f14');
    expect(orange.filter((s) => s.base)).toEqual([{ step: 500, base: true, hex: '#EC5F14' }]);
    expect(isLight(orange[0].hex)).toBe(true);
    expect(isLight(orange[10].hex)).toBe(false);
    expect(new Set(orange.map((s) => s.hex)).size).toBe(11);
    for (let i = 1; i < 11; i++) expect(lightness(orange[i].hex)).toBeLessThan(lightness(orange[i - 1].hex));
    // une couleur claire se range en haut de la gamme, une foncée en bas
    expect(shadeScale('#F1E2DA').find((s) => s.base)!.step).toBeLessThanOrEqual(200);
    expect(shadeScale('#431604').find((s) => s.base)!.step).toBeGreaterThanOrEqual(900);
  });

  it('écrit les codes des nuances dans la couleur de texte la plus lisible', () => {
    // orange moyen : le texte foncé contraste mieux que le clair
    expect(wantsDarkText('#F27848')).toBe(true);
    expect(wantsDarkText('#B5470D')).toBe(false);
    expect(wantsDarkText('#431604')).toBe(false);
  });

  it('Couleur : saisir les deux couleurs opposées construit les neutres', async () => {
    renderAt('/ressources/couleur');
    const user = await unlock();
    await user.type(
      await screen.findByRole('textbox', { name: 'Couleur claire des neutres' }),
      'F7F4ED{Enter}',
    );
    await user.type(screen.getByRole('textbox', { name: 'Couleur foncée des neutres' }), '1B1B1B{Enter}');
    const list = await screen.findByRole('list', { name: 'Neutres' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(11);
    expect(within(list).getByRole('button', { name: 'Copier Neutres 50 #F7F4ED' })).toBeInTheDocument();
  });
});

describe('icônes (bibliothèque Central)', () => {
  it('compose la variante et le lien à la taille et à la couleur choisies', () => {
    const variant = variantId({ style: 'filled', corner: 3, stroke: 2 });
    expect(variant).toBe('round-filled-radius-3-stroke-2');
    expect(iconSvgUrl('trash-can', variant, 32, '#EC5F14')).toBe(
      'https://visual.systems/api/modules/icon/central/trash-can.svg?variant=round-filled-radius-3-stroke-2&size=32&color=%23EC5F14',
    );
    expect(iconSvgUrl('trash-can', variant, 24, null)).not.toContain('color=');
  });
});

describe('déclinaisons des logos', () => {
  const SOURCE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>.a{fill:red}</style>' +
    '<path class="a" d="M0 0h5v5z"/><path fill="blue" stroke="none" d="M5 5h5v5z"/>' +
    '<path style="fill: green; stroke: black" d="M0 5h5v5z"/><path fill="none" d="M0 0"/></svg>';

  it('recolore chaque remplissage et contour, garde les « none »', () => {
    const out = recolorSvg(SOURCE, '#EC5F14');
    expect(out).toContain('.a{fill:#EC5F14}');
    expect(out).toContain('fill="#EC5F14" stroke="none"');
    expect(out).toContain('fill:#EC5F14; stroke:#EC5F14');
    expect(out).toContain('fill="none"');
    expect(out).not.toMatch(/red|blue|green|black/);
  });

  it('donne l’original puis une version par couleur, sur fond foncé pour les couleurs claires', () => {
    const variants = logoVariants(SOURCE, [
      { name: 'Orange', hex: '#EC5F14' },
      { name: 'Lin', hex: '#F1E2DA' },
      { name: 'Doublon', hex: '#ec5f14' },
      { name: 'Vide', hex: '' },
    ]);
    expect(variants.map((v) => [v.name, v.dark])).toEqual([
      ['Original', false],
      ['Orange', false],
      ['Lin', true],
    ]);
  });

  it('retire les scripts et les attributs « on… » d’un SVG déposé', () => {
    const clean = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)"><rect/></a></svg>',
    )!;
    expect(clean).not.toMatch(/onload|script|javascript/);
    expect(sanitizeSvg('<html></html>')).toBeNull();
  });
});

describe('mode édition des Ressources', () => {
  it('refuse un mauvais code, accepte le bon, puis se verrouille', async () => {
    renderAt('/ressources/couleur');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
    await user.type(screen.getByLabelText('Code'), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce code ne fonctionne pas.');
    expect(screen.queryByRole('button', { name: /Ajouter une couleur/ })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Code'));
    await user.type(screen.getByLabelText('Code'), LOCAL_EDITOR_CODE);
    await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
    await screen.findByRole('heading', { name: 'Mode édition' });
    expect(screen.getAllByRole('button', { name: /Ajouter une couleur/ })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    expect(screen.queryByRole('button', { name: /Ajouter une couleur/ })).not.toBeInTheDocument();
  });

  it('Couleur : ajoute une couleur, saisit son code, puis la montre en lecture avec RVB et TSL', async () => {
    renderAt('/ressources/couleur');
    expect(await screen.findByText('Aucune couleur pour l’instant.')).toBeInTheDocument();
    const user = await unlock();
    await user.click(screen.getAllByRole('button', { name: /Ajouter une couleur/ })[0]);
    const name = await screen.findByRole('textbox', { name: 'Nom de la couleur' });
    await user.clear(name);
    await user.type(name, 'Orange{Enter}');
    await user.type(screen.getByRole('textbox', { name: 'Code HEX de Orange' }), 'ec5f14{Enter}');
    await waitFor(() =>
      expect(JSON.stringify(JSON.parse(localStorage.getItem('bhc.store.res-colors')!))).toContain('#EC5F14'),
    );

    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    const list = await screen.findByRole('list', { name: 'Palette de couleur principale' });
    expect(within(list).getByText('Orange')).toBeInTheDocument();
    // HEX, RVB, CMJN et Pantone calculés et affichés sur la carte
    expect(within(list).getByRole('button', { name: 'Copier HEX #EC5F14' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Copier RVB rgb(236 95 20)' })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Copier CMJN C0 M60 J92 N7' })).toBeInTheDocument();
    expect(
      within(list).getByRole('button', { name: `Copier Pantone ${nearestPantone('#EC5F14')}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger la palette (CSS)' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    // les nuances de la couleur se construisent seules ; plus de section Dégradés
    const shades = screen.getByRole('list', { name: 'Orange' });
    expect(within(shades).getAllByRole('listitem')).toHaveLength(11);
    expect(
      within(shades).getByRole('button', { name: 'Copier Orange 500 #EC5F14 (couleur d’origine)' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dégradés' })).not.toBeInTheDocument();
  });

  it('Logo : un seul SVG par section, décliné dans chaque couleur de la marque', async () => {
    localStorage.setItem(
      'bhc.store.res-colors',
      JSON.stringify({
        a: { group: 'principale', name: 'Orange', hex: '#EC5F14', order: 0 },
        b: { group: 'secondaire', name: 'Lin', hex: '#F1E2DA', order: 1 },
      }),
    );
    renderAt('/ressources/logo');
    expect(await screen.findByText('Aucun logo pour l’instant.')).toBeInTheDocument();
    const user = await unlock();
    // sections proposées d'office
    expect(
      screen.getAllByRole('textbox', { name: 'Nom de la section' }).map((t) => (t as HTMLInputElement).value),
    ).toEqual(['Logo principal', 'Symbole']);
    const input = (await screen.findByLabelText(/Dépose le SVG de « Logo principal »/)) as HTMLInputElement;
    await user.upload(input, new File([LOGO], 'logo.svg', { type: 'image/svg+xml' }));
    const list = await screen.findByRole('list', { name: 'Logo principal' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3); // original, orange, lin
    for (const format of ['SVG', 'PNG', 'PDF'])
      expect(
        within(list).getByRole('button', { name: `Télécharger Logo principal Orange en ${format}` }),
      ).toBeInTheDocument();
    expect(screen.getByLabelText(/Remplacer le SVG de « Logo principal »/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ajouter une section/ }));
    expect(await screen.findByDisplayValue('Nouvelle section')).toBeInTheDocument();
  });

  it('Logo : un fichier qui n’est pas un SVG est refusé', async () => {
    renderAt('/ressources/logo');
    await unlock();
    const input = (await screen.findByLabelText(/Dépose le SVG de « Symbole »/)) as HTMLInputElement;
    await userEvent.setup({ applyAccept: false }).upload(input, new File(['bonjour'], 'notes.svg'));
    expect(await screen.findByText('« notes.svg » n’est pas un SVG.')).toBeInTheDocument();
  });

  it('Typographie : Geist par défaut, avec son échelle', async () => {
    renderAt('/ressources/typographie');
    expect(await screen.findByText('Geist')).toBeInTheDocument();
    // la famille complète en un seul téléchargement, pas de style par style
    expect(
      within(screen.getByRole('list', { name: 'Styles (TTF / OTF)' })).getAllByRole('listitem'),
    ).toHaveLength(18);
    expect(screen.getByRole('button', { name: /Télécharger la famille complète/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Télécharger Geist Regular' })).not.toBeInTheDocument();
    expect(screen.getByText('Titre XXL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le code CSS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le CSS de Titre XXL' })).toBeInTheDocument();
    // chaque graisse est écrite dans sa graisse
    expect(within(screen.getByRole('list', { name: 'Graisses' })).getByText('700 Bold')).toHaveStyle({
      fontWeight: '700',
    });
  });

  it('Patterns prédéfinis : filtre par format, en attendant les layouts', async () => {
    renderAt('/ressources/patterns');
    const filters = await screen.findByRole('group', { name: 'Filtrer par format' });
    expect(
      within(filters)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Tout', '1:1', '4:5', '9:16', '16:9', '4:3', 'A4', 'Bannière']);
    expect(screen.getByText(/apparaîtront ici/)).toBeInTheDocument();
  });

  it('Inspiration et Imagerie : vides au départ', async () => {
    renderAt('/ressources/inspiration');
    expect(await screen.findByText('Aucune image d’inspiration pour l’instant.')).toBeInTheDocument();
  });
});
