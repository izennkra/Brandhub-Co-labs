import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { QR_MARGIN, qrMatrix, qrName, qrPath, qrSide } from '../src/lib/resources/qr';

describe('QR code : encodage', () => {
  it('encode un lien avec la correction d’erreur la plus forte et une marge de 4 modules', () => {
    const matrix = qrMatrix('https://www.colabs.fr');
    if ('error' in matrix) throw new Error(matrix.error);
    // correction H : plus de modules que la correction la plus faible pour le même lien
    const low = QRCode.create('https://www.colabs.fr', { errorCorrectionLevel: 'L' }).modules.size;
    expect(matrix.size).toBeGreaterThan(low);
    expect(qrSide(matrix)).toBe(matrix.size + 2 * QR_MARGIN);
    // repère de position en haut à gauche : coin sombre, puis anneau clair
    expect(matrix.dark(0, 0)).toBe(true);
    expect(matrix.dark(1, 1)).toBe(false);
    expect(qrPath(matrix).startsWith(`M${QR_MARGIN} ${QR_MARGIN}h1v1h-1z`)).toBe(true);
  });

  it('refuse un lien vide ou trop long', () => {
    expect(qrMatrix('   ')).toHaveProperty('error');
    expect(qrMatrix('x'.repeat(1201))).toHaveProperty('error');
  });

  it('propose un nom à partir du site', () => {
    expect(qrName('https://www.colabs.fr/contact')).toBe('QR colabs.fr');
    expect(qrName('pas un lien')).toBe('QR code');
  });
});

describe('page Ressource › QR code', () => {
  it('montre l’aperçu dès qu’un lien est collé ; sans lien, le bouton est inactif', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/ressources/qr-code'] });
    render(<RouterProvider router={router} />);
    const button = await screen.findByRole('button', { name: 'Styliser dans l’Illustration' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox', { name: 'Lien' }), 'https://www.colabs.fr');
    expect(screen.getByRole('img', { name: 'QR code de https://www.colabs.fr' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nom' })).toHaveAttribute('placeholder', 'QR colabs.fr');
    expect(button).toBeEnabled();
  });
});
