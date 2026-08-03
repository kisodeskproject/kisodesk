import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useState } from 'react';

import { KEYBOARD_LAYOUT_STORAGE_KEY, KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY } from '@/lib/keyboardLayouts';

let KeyboardLayoutProvider: typeof import('./KeyboardLayoutContext').KeyboardLayoutProvider;
let useKeyboardLayout: typeof import('./KeyboardLayoutContext').useKeyboardLayout;

const mockUpdateMyPreferences = jest.fn<(preferences: unknown) => Promise<unknown>>();
const mockUpdateUser = jest.fn();
let mockAuth = {
  user: null as { layout?: string } | null,
  isAuthenticated: false,
  updateUser: mockUpdateUser,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('@/lib/authClient', () => ({
  updateMyPreferences: (preferences: unknown) => mockUpdateMyPreferences(preferences),
}));

function ContextConsumer() {
  const {
    selectedLayout,
    hasLayoutPreference,
    setSelectedLayout,
    getLayoutForLanguage,
    physicalFamily,
    hasPhysicalFamilyPreference,
    setPhysicalFamily,
  } = useKeyboardLayout();
  const [saveFailed, setSaveFailed] = useState(false);

  return (
    <>
      <p data-testid="layout">{selectedLayout.id}</p>
      <p data-testid="spanish-layout">{getLayoutForLanguage('es-latam').id}</p>
      <p data-testid="danish-layout">{getLayoutForLanguage('da').id}</p>
      <p data-testid="english-layout">{getLayoutForLanguage('en-US').id}</p>
      <p data-testid="physical-family">{physicalFamily}</p>
      <p data-testid="has-physical-preference">{String(hasPhysicalFamilyPreference)}</p>
      <p data-testid="has-preference">{String(hasLayoutPreference)}</p>
      <p data-testid="save-failed">{String(saveFailed)}</p>
      <button
        type="button"
        onClick={() => {
          void setSelectedLayout('qwerty-en').catch(() => setSaveFailed(true));
        }}
      >
        Select US
      </button>
      <button type="button" onClick={() => setPhysicalFamily?.('ABNT2')}>
        Select ABNT2
      </button>
    </>
  );
}

describe('KeyboardLayoutContext', () => {
  beforeAll(async () => {
    ({ KeyboardLayoutProvider, useKeyboardLayout } = await import('./KeyboardLayoutContext'));
  });

  beforeEach(() => {
    localStorage.clear();
    mockUpdateMyPreferences.mockReset();
    mockUpdateUser.mockReset();
    mockAuth = {
      user: null,
      isAuthenticated: false,
      updateUser: mockUpdateUser,
    };
  });

  it('marks a guest local selection as an explicit preference', async () => {
    render(
      <KeyboardLayoutProvider>
        <ContextConsumer />
      </KeyboardLayoutProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select US' }));

    await waitFor(() => {
      expect(screen.getByTestId('layout').textContent).toBe('qwerty-en');
      expect(screen.getByTestId('has-preference').textContent).toBe('true');
    });
    expect(localStorage.getItem(KEYBOARD_LAYOUT_STORAGE_KEY)).toBe('qwerty-en');
    expect(mockUpdateMyPreferences).not.toHaveBeenCalled();
  });

  it('uses the page language for characters without changing the saved layout preference', async () => {
    render(
      <KeyboardLayoutProvider>
        <ContextConsumer />
      </KeyboardLayoutProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select US' }));

    await waitFor(() => {
      expect(screen.getByTestId('layout').textContent).toBe('qwerty-en');
    });
    expect(screen.getByTestId('spanish-layout').textContent).toBe('qwerty-latam');
    expect(screen.getByTestId('danish-layout').textContent).toBe('qwerty-da');
    expect(screen.getByTestId('english-layout').textContent).toBe('qwerty-en');
  });

  it('keeps the physical family while the logical layout changes by language', async () => {
    render(
      <KeyboardLayoutProvider>
        <ContextConsumer />
      </KeyboardLayoutProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select ABNT2' }));

    await waitFor(() => {
      expect(screen.getByTestId('physical-family').textContent).toBe('ABNT2');
    });
    expect(screen.getByTestId('spanish-layout').textContent).toBe('qwerty-latam');
    expect(screen.getByTestId('danish-layout').textContent).toBe('qwerty-da');
  });

  it('persists a confirmed physical family across a remount', async () => {
    const first = render(<KeyboardLayoutProvider><ContextConsumer /></KeyboardLayoutProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Select ABNT2' }));
    await waitFor(() => expect(localStorage.getItem(KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY)).toBe('ABNT2'));
    first.unmount();

    render(<KeyboardLayoutProvider><ContextConsumer /></KeyboardLayoutProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('physical-family').textContent).toBe('ABNT2');
      expect(screen.getByTestId('has-physical-preference').textContent).toBe('true');
    });
  });

  it('keeps a confirmed JIS physical family', async () => {
    localStorage.setItem(KEYBOARD_LAYOUT_STORAGE_KEY, 'qwerty-en');
    localStorage.setItem(KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY, 'JIS');
    render(<KeyboardLayoutProvider><ContextConsumer /></KeyboardLayoutProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('physical-family').textContent).toBe('JIS');
      expect(screen.getByTestId('has-physical-preference').textContent).toBe('true');
    });
  });

  it('rolls back local state when the authenticated preference cannot be saved', async () => {
    mockAuth = {
      user: { layout: 'QWERTY_ES' },
      isAuthenticated: true,
      updateUser: mockUpdateUser,
    };
    mockUpdateMyPreferences.mockRejectedValue(new Error('network error'));

    render(
      <KeyboardLayoutProvider>
        <ContextConsumer />
      </KeyboardLayoutProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('layout').textContent).toBe('qwerty-es');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Select US' }));

    await waitFor(() => {
      expect(screen.getByTestId('save-failed').textContent).toBe('true');
    });
    expect(screen.getByTestId('layout').textContent).toBe('qwerty-es');
    expect(screen.getByTestId('has-preference').textContent).toBe('true');
    expect(localStorage.getItem(KEYBOARD_LAYOUT_STORAGE_KEY)).toBe('qwerty-es');
  });
});
