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
const panelHeader = () => screen.getByRole('button', { name: 'Éditeur' });
const exportButtons = () => screen.queryAllByRole('button', { name: /Exporter toutes les ressources/ });

describe('habillage des pages Ressource', () => {
  it('affiche la bande (panneau et export), panneau fermé au départ', () => {
    renderAt('/ressources/logo');
    expect(panelToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(sidePanel()).not.toBeInTheDocument();
    expect(exportButtons()).toHaveLength(1);
  });

  it('ouvre le panneau à la place de la bande, puis le replie depuis son en-tête', async () => {
    const user = userEvent.setup();
    renderAt('/ressources/logo');
    await user.click(panelToggle());
    expect(sidePanel()).toBeVisible();
    // plus de bande en plus : un seul bouton de panneau et un seul export, dans le panneau
    expect(screen.queryByRole('button', { name: 'Modifier les ressources' })).not.toBeInTheDocument();
    expect(panelHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(panelHeader()).toHaveFocus();
    expect(exportButtons()).toHaveLength(1);
    expect(sidePanel()).toContainElement(exportButtons()[0]);

    await user.click(panelHeader());
    expect(sidePanel()).not.toBeInTheDocument();
    expect(panelToggle()).toHaveFocus();
  });

  it('garde le panneau ouvert d’une page Ressource à l’autre', async () => {
    renderAt('/ressources/logo');
    await userEvent.click(panelToggle());
    await userEvent.click(screen.getByRole('link', { name: 'Couleur' }));
    expect(sidePanel()).toBeVisible();
  });

  it("n'apparaît pas sur les pages Tool", () => {
    renderAt('/outils/motif');
    expect(screen.queryByRole('button', { name: 'Modifier les ressources' })).not.toBeInTheDocument();
    expect(exportButtons()).toHaveLength(0);
  });
});
