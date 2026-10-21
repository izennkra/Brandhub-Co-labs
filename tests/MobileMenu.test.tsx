import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { simulateNarrowScreen } from './setup';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const mainNav = () => screen.queryByRole('navigation', { name: 'Navigation principale' });
const menuButton = () => screen.getByRole('button', { name: 'Ouvrir le menu' });

describe('menu repliable sur petit écran (sous 1280 px)', () => {
  it("n'existe pas sur grand écran : la colonne de gauche est toujours visible", () => {
    renderAt('/outils/motif');
    expect(screen.queryByRole('button', { name: 'Ouvrir le menu' })).not.toBeInTheDocument();
    expect(mainNav()).toBeInTheDocument();
  });

  it('replie la colonne de gauche derrière un bouton', () => {
    simulateNarrowScreen();
    renderAt('/outils/motif');
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(mainNav()).not.toBeInTheDocument();
  });

  it('ouvre le menu et place le focus sur « Fermer le menu »', async () => {
    simulateNarrowScreen();
    renderAt('/outils/motif');
    await userEvent.click(menuButton());
    expect(mainNav()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveFocus();
  });

  it('se ferme avec Échap et rend le focus au bouton du menu', async () => {
    simulateNarrowScreen();
    renderAt('/outils/motif');
    await userEvent.click(menuButton());
    await userEvent.keyboard('{Escape}');
    expect(mainNav()).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it('se ferme après avoir choisi une page', async () => {
    simulateNarrowScreen();
    const router = renderAt('/outils/motif');
    await userEvent.click(menuButton());
    await userEvent.click(screen.getByRole('link', { name: 'Layout editor' }));
    expect(router.state.location.pathname).toBe('/outils/layout-editor');
    expect(mainNav()).not.toBeInTheDocument();
  });

  it('rend le reste de la page inactif tant que le menu est ouvert', async () => {
    simulateNarrowScreen();
    renderAt('/outils/motif');
    await userEvent.click(menuButton());
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert');
  });
});
