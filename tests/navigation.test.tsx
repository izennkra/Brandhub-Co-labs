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

const TOOL_PAGES = [
  { path: '/outils/motif', title: 'Motif' },
  { path: '/outils/illustrations', title: 'Illustrations iconographique' },
  { path: '/outils/layout-editor', title: 'Layout editor' },
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
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(TOOL_PAGES.map((page) => page.title));
  });

  it.each(TOOL_PAGES)('ouvre $title par son adresse', ({ path, title }) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe(`${title} · Brand Hub · Co-labs`);
  });

  it('marque une seule page comme active', () => {
    renderAt('/outils/illustrations');
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    const active = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(active.map((link) => link.textContent)).toEqual(['Illustrations iconographique']);
  });

  it('change de page au clic', async () => {
    const router = renderAt('/outils/motif');
    await userEvent.click(screen.getByRole('link', { name: 'Layout editor' }));
    expect(router.state.location.pathname).toBe('/outils/layout-editor');
    expect(screen.getByRole('heading', { level: 1, name: 'Layout editor' })).toBeInTheDocument();
  });
});
