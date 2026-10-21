import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const sidePanel = () => screen.queryByRole('complementary', { name: 'Panneau latéral' });
const panelToggle = () => screen.getByRole('button', { name: 'Modifier les ressources' });

describe('habillage des pages Ressource', () => {
  it('affiche le bouton de panneau, fermé au départ', () => {
    renderAt('/ressources/logo');
    expect(panelToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(sidePanel()).not.toBeInTheDocument();
  });

  it('ouvre et ferme le panneau latéral', async () => {
    renderAt('/ressources/logo');
    await userEvent.click(panelToggle());
    expect(panelToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(sidePanel()).toBeVisible();

    await userEvent.click(panelToggle());
    expect(panelToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(sidePanel()).not.toBeInTheDocument();
  });

  it('garde le panneau ouvert d’une page Ressource à l’autre', async () => {
    renderAt('/ressources/logo');
    await userEvent.click(panelToggle());
    await userEvent.click(screen.getByRole('link', { name: 'Couleur' }));
    expect(sidePanel()).toBeVisible();
  });

  it('désactive « Tout télécharger » quand la page est vide', async () => {
    renderAt('/ressources/couleur');
    expect(await screen.findByRole('button', { name: 'Rien à télécharger sur cette page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it("n'apparaît pas sur les pages Tool", () => {
    renderAt('/outils/motif');
    expect(screen.queryByRole('button', { name: 'Modifier les ressources' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /télécharger/i })).not.toBeInTheDocument();
  });
});
