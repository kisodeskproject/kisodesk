import { render, screen } from '@testing-library/react';
import { describe, expect, it } from '@jest/globals';

import AdaptivePracticeKeys from './AdaptivePracticeKeys';

describe('AdaptivePracticeKeys', () => {
  it('no muestra objetivos en práctica libre', () => {
    const { container } = render(<AdaptivePracticeKeys keys={[]} label="Teclas en práctica" />);
    expect(container.childElementCount).toBe(0);
  });

  it('renderiza los objetivos en orden sin destacar una tecla', () => {
    render(<AdaptivePracticeKeys keys={['á', 'z', '.', 'o']} label="Teclas en práctica" />);

    expect(screen.getByRole('heading', { name: 'Teclas en práctica:' })).not.toBeNull();
    expect(screen.getByRole('list', { name: 'Teclas en práctica: á, z, ., o' })).not.toBeNull();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['á', 'z', '.', 'o']);
    expect(screen.getByText('á').getAttribute('data-practice-key-state')).toBe('default');
    expect(screen.getByText('z').getAttribute('data-practice-key-state')).toBe('default');
  });

  it('se actualiza cuando cambia el ejercicio', () => {
    const view = render(<AdaptivePracticeKeys keys={['a', 's']} label="Teclas en práctica" />);
    view.rerender(<AdaptivePracticeKeys keys={['ñ', 'á']} label="Teclas en práctica" />);

    expect(screen.queryByText('a')).toBeNull();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['ñ', 'á']);
    expect(screen.getByText('ñ').getAttribute('data-practice-key-state')).toBe('default');
  });
});
