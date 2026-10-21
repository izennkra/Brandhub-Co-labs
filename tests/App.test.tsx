import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';

describe('App', () => {
  it('affiche le nom co-labs', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'co-labs' })).toBeInTheDocument();
  });
});
