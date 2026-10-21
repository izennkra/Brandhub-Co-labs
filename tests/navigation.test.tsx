import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const mainNav = () => screen.getByRole('navigation', { name: 'Navigation principale' });
const sectionsNav = () => screen.getByRole('navigation', { name: 'Sections' });
const linkTexts = (nav: HTMLElement) =>
  within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent);

const TOOL_PAGES = [
  { path: '/outils/motif', title: 'Motif' },
  { path: '/outils/illustration', title: 'Illustration' },
  { path: '/outils/layout-editor', title: 'Layout editor' },
];

const RESOURCE_PAGES = [
  { path: '/ressources/logo', title: 'Logo' },
  { path: '/ressources/typographie', title: 'Typographie' },
  { path: '/ressources/couleur', title: 'Couleur' },
  { path: '/ressources/iconographie', title: 'Iconographie' },
  { path: '/ressources/imagerie', title: 'Imagerie' },
  { path: '/ressources/patterns', title: 'Patterns prédéfinis' },
  { path: '/ressources/inspiration', title: 'Inspiration' },
];

describe('navigation : colonne de gauche et pages Tool', () => {
  it("redirige l'accueil vers Motif", () => {
    const router = renderAt('/');
    expect(router.state.location.pathname).toBe('/outils/motif');
    expect(screen.getByRole('heading', { level: 1, name: 'Motif' })).toBeInTheDocument();
  });

  it('affiche le logo co-labs et le badge BETA', () => {
    renderAt('/outils/motif');
    expect(screen.getByRole('img', { name: 'co-labs' })).toBeInTheDocument();
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('liste les 3 pages Tool dans la navigation principale', () => {
    renderAt('/outils/motif');
    expect(linkTexts(mainNav())).toEqual(TOOL_PAGES.map((page) => page.title));
  });

  it.each(TOOL_PAGES)('ouvre $title par son adresse', ({ path, title }) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe(`${title} · Brand Hub · Co-labs`);
  });

  it('marque une seule page comme active', () => {
    renderAt('/outils/illustration');
    const active = within(mainNav())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(active.map((link) => link.textContent)).toEqual(['Illustration']);
  });

  it('change de page au clic', async () => {
    const router = renderAt('/outils/motif');
    await userEvent.click(screen.getByRole('link', { name: 'Layout editor' }));
    expect(router.state.location.pathname).toBe('/outils/layout-editor');
    expect(screen.getByRole('heading', { level: 1, name: 'Layout editor' })).toBeInTheDocument();
  });
});

describe('navigation : sélecteur Tool / Ressource et pages Ressource', () => {
  it('propose les deux sections, avec la section courante marquée', () => {
    renderAt('/outils/motif');
    expect(linkTexts(sectionsNav())).toEqual(['Tool', 'Ressource']);
    expect(within(sectionsNav()).getByRole('link', { name: 'Tool' })).toHaveAttribute('aria-current', 'true');
    expect(within(sectionsNav()).getByRole('link', { name: 'Ressource' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('bascule vers les Ressources et liste leurs 7 pages', async () => {
    const router = renderAt('/outils/motif');
    await userEvent.click(within(sectionsNav()).getByRole('link', { name: 'Ressource' }));
    expect(router.state.location.pathname).toBe('/ressources/logo');
    expect(linkTexts(mainNav())).toEqual(RESOURCE_PAGES.map((page) => page.title));
    expect(within(sectionsNav()).getByRole('link', { name: 'Ressource' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it.each(RESOURCE_PAGES)('ouvre $title par son adresse', ({ path, title }) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe(`${title} · Brand Hub · Co-labs`);
  });

  it('revient sur la dernière page visitée de chaque section', async () => {
    const router = renderAt('/ressources/couleur');
    const go = (name: string) => userEvent.click(within(sectionsNav()).getByRole('link', { name }));

    await go('Tool');
    expect(router.state.location.pathname).toBe('/outils/motif');

    await userEvent.click(within(mainNav()).getByRole('link', { name: 'Layout editor' }));
    await go('Ressource');
    expect(router.state.location.pathname).toBe('/ressources/couleur');

    await go('Tool');
    expect(router.state.location.pathname).toBe('/outils/layout-editor');
  });

  it("n'affiche pas d'entrée Feedback", () => {
    renderAt('/ressources/logo');
    expect(screen.queryByText(/feedback/i)).not.toBeInTheDocument();
  });
});
