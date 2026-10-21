import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Icon, type IconName } from '../src/components/Icon';

function svgOf(container: HTMLElement) {
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('Aucun <svg> rendu');
  return svg;
}

describe('Icon', () => {
  it('est décorative par défaut : masquée aux lecteurs d’écran et non focalisable', () => {
    const { container } = render(<Icon name="toolbox" />);
    const svg = svgOf(container);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');
  });

  it('devient une image accessible avec un aria-label', () => {
    render(<Icon name="arrow-inbox" aria-label="Télécharger" />);
    const img = screen.getByRole('img', { name: 'Télécharger' });
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('devient une image accessible avec un titre', () => {
    render(<Icon name="cross-medium" title="Supprimer" />);
    expect(screen.getByRole('img', { name: 'Supprimer' })).toBeInTheDocument();
  });

  it('hérite de la couleur du texte (currentColor)', () => {
    const { container } = render(<Icon name="toolbox" />);
    expect(svgOf(container)).toHaveAttribute('color', 'currentColor');
  });

  it('prend la taille sm par défaut', () => {
    const { container } = render(<Icon name="toolbox" />);
    expect(svgOf(container)).toHaveAttribute('data-size', 'sm');
  });

  it('adapte l’épaisseur du trait à la taille (variante Central)', () => {
    const small = render(<Icon name="chevron-down-small" size="xs" />);
    expect(small.container.querySelector('path')).toHaveAttribute('stroke-width', '2');
    small.unmount();

    const large = render(<Icon name="chevron-down-small" size="lg" />);
    expect(large.container.querySelector('path')).toHaveAttribute('stroke-width', '1.5');
  });

  it('refuse un nom d’icône inconnu', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Icon name={'inexistante' as IconName} />)).toThrow('Icône inconnue : inexistante');
  });
});
