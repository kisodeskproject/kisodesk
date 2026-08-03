import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import KeyboardDetectionWizard from './KeyboardDetectionWizard';

jest.mock('next/navigation', () => ({
  useParams: () => ({ lang: 'es' }),
}));

describe('KeyboardDetectionWizard', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });
  });

  it('opens directly on the Enter-shape question', () => {
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: '¿Qué forma tiene tu Enter?' }),
    ).toBeTruthy();
  });

  it('stores ANSI when the Enter is rectangular and has two keys after 0', async () => {
    const onSelectPhysicalFamily = jest.fn<(family: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>().mockResolvedValue(undefined);
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter horizontal' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(onSelectPhysicalFamily).toHaveBeenCalledWith('ANSI');
    });
    expect(await screen.findByRole('heading', { name: 'Forma de tu teclado identificada: ANSI' })).toBeTruthy();
  });

  it('distinguishes ISO from ABNT2 with the key next to right Shift', async () => {
    const onSelectPhysicalFamily = jest.fn<(family: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>().mockResolvedValue(undefined);
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter ISO estándar' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));

    await waitFor(() => expect(onSelectPhysicalFamily).toHaveBeenCalledWith('ISO'));
  });

  it('stores ABNT2 when IntlRo exists', async () => {
    const onSelectPhysicalFamily = jest.fn<(family: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>().mockResolvedValue(undefined);
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter ISO estándar' }));
    fireEvent.click(screen.getByRole('button', { name: '1' }));

    await waitFor(() => expect(onSelectPhysicalFamily).toHaveBeenCalledWith('ABNT2'));
  });

  it('keeps the selection screen open and reports a save failure', async () => {
    const onSelectPhysicalFamily = jest
      .fn<(family: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>()
      .mockRejectedValue(new Error('network error'));
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter horizontal' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No se pudo guardar la distribución. Revisa tu conexión e vuelve a intentarlo.',
    );
    expect(
      screen.getByRole('heading', {
        name: '¿Cuántas teclas hay entre 0 y Retroceso?',
      }),
    ).toBeTruthy();
  });

  it.each([
    ['2', 'JIS'],
    ['1', 'KS'],
  ] as const)('stores %s after identifying its East Asian bottom row', async (buttonName, family) => {
    const onSelectPhysicalFamily = jest
      .fn<(nextFamily: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>()
      .mockResolvedValue(undefined);
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter horizontal' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    await waitFor(() => expect(onSelectPhysicalFamily).toHaveBeenCalledWith(family));
  });

  it('stores the Big Ass Enter family directly', async () => {
    const onSelectPhysicalFamily = jest
      .fn<(family: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS') => Promise<void>>()
      .mockResolvedValue(undefined);
    render(<KeyboardDetectionWizard lang="es-latam" onSelectPhysicalFamily={onSelectPhysicalFamily} />);

    fireEvent.click(screen.getByRole('button', { name: 'Big Ass Enter' }));

    await waitFor(() => expect(onSelectPhysicalFamily).toHaveBeenCalledWith('BIG_ASS'));
    expect(await screen.findByRole('heading', { name: 'Forma de tu teclado identificada: ISO BA' })).toBeTruthy();
  });
});
