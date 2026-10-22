import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { EditorAccess } from '../src/components/engine/EditorAccess';
import { lockEditor } from '../src/lib/resources/editor';
import { LOCAL_EDITOR_CODE } from '../src/lib/store/store';

afterEach(() => lockEditor());

describe('mode édition depuis la section Images', () => {
  it('s’ouvre avec le code, refuse un mauvais code, puis se verrouille', async () => {
    const user = userEvent.setup();
    render(<EditorAccess />);
    await user.click(
      screen.getByRole('button', { name: /Supprimer définitivement \? Ouvrir le mode édition/ }),
    );
    const field = screen.getByLabelText('Code du mode édition');
    await user.type(field, 'mauvais{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce code ne fonctionne pas.');
    await user.clear(field);
    await user.type(field, `${LOCAL_EDITOR_CODE}{Enter}`);
    expect(await screen.findByText(/la croix supprime définitivement/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    expect(screen.getByRole('button', { name: /Ouvrir le mode édition/ })).toBeInTheDocument();
  });
});
