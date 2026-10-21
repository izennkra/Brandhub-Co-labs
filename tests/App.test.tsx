import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('App', () => {
  it('démarre sur la page Motif avec la navigation', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Motif' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
  });
});
