import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import TypingArea, { type TypingStats } from './TypingArea';
import { getEnabledLayoutById, type KeyboardLayout } from '@/lib/keyboardLayouts';
import { KeyboardLayoutContext } from '@/contexts/KeyboardLayoutContext';
import {
  getHandReferencesForExpectedKey,
  getKeyboardGuideKeysForExpectedKey,
} from '@/lib/keyboardGuides';

const spanish = getEnabledLayoutById('qwerty-es')!;
const latam = getEnabledLayoutById('qwerty-latam')!;
const danish = getEnabledLayoutById('qwerty-da')!;

function renderTyping(text: string, layout = spanish, hasLayoutPreference = true) {
  const onProgress = jest.fn();
  const onComplete = jest.fn();
  const onError = jest.fn();
  const onExpectedKeyChange = jest.fn();
  const onOpenDetection = jest.fn();
  const onLayoutChange = jest.fn(async (layout: KeyboardLayout) => {
    void layout;
  });
  render(
    <KeyboardLayoutContext.Provider
      value={{
        selectedLayout: layout,
        layouts: [layout],
        isReady: true,
        hasLayoutPreference,
        isSaving: false,
        isDetectionOpen: false,
        setSelectedLayout: async () => undefined,
        openDetection: onOpenDetection,
        closeDetection: () => undefined,
        getLayoutForLanguage: () => layout,
        getLayoutsForLanguage: () => [layout],
      }}
    >
      <TypingArea
        text={text}
        selectedLayout={layout}
        onLayoutChange={onLayoutChange}
        onProgress={onProgress}
        onComplete={onComplete}
        onError={onError}
        onExpectedKeyChange={onExpectedKeyChange}
      />
    </KeyboardLayoutContext.Provider>,
  );
  return {
    input: screen.getByRole('textbox'),
    onComplete,
    onError,
    onExpectedKeyChange,
    onProgress,
    onLayoutChange,
    onOpenDetection,
  };
}

function press(input: HTMLElement, key: string, code: string, shiftKey = false) {
  fireEvent.keyDown(input, { key, code, shiftKey });
}

describe('TypingArea physical keyboard flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('informa cuando no hay una preferencia de teclado guardada', () => {
    renderTyping('ab', spanish, false);

    expect(screen.getByText(/Aún no hemos identificado la forma de tu teclado/i)).toBeTruthy();
  });

  it('escribe caracteres daneses según la distribución activa, aunque el sistema emita otra etiqueta', () => {
    const { input, onComplete } = renderTyping('æÆøå', danish);

    press(input, ';', 'Semicolon');
    press(input, 'Ñ', 'Semicolon', true);
    press(input, 'Dead', 'Quote');
    press(input, 'Dead', 'BracketLeft');
    act(() => jest.advanceTimersByTime(200));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctChars: 4, accuracy: 100 }),
    );
  });

  it('uses selected dead keys even when the system reports a normal character', () => {
    const { input, onComplete } = renderTyping('á', spanish);

    press(input, 'x', 'Quote');
    press(input, 'a', 'KeyA');
    act(() => jest.advanceTimersByTime(200));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctChars: 1, accuracy: 100 }),
    );
  });

  it('writes a selected-layout letter when the system reports a dead key', () => {
    const { input, onComplete } = renderTyping('ø', danish);

    press(input, 'Dead', 'Quote');
    act(() => jest.advanceTimersByTime(200));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctChars: 1, accuracy: 100 }),
    );
  });

  it('uses the selected Turkish layout for dotted and dotless I with Shift', () => {
    const turkish = getEnabledLayoutById('qwerty-tr')!;
    const { input, onComplete } = renderTyping('ıIİ', turkish);

    press(input, 'i', 'KeyI');
    press(input, 'I', 'KeyI', true);
    press(input, 'Ñ', 'Quote', true);
    act(() => jest.advanceTimersByTime(200));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctChars: 3, accuracy: 100 }),
    );
  });

  it('keeps navigation controls from becoming input characters', () => {
    const { input, onComplete } = renderTyping('a', spanish);

    press(input, 'ArrowRight', 'ArrowRight');
    press(input, 'Escape', 'Escape');
    press(input, 'a', 'KeyA');
    act(() => jest.advanceTimersByTime(200));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctChars: 1, accuracy: 100 }),
    );
  });

  it('lleva al identificador cuando falta la familia física', () => {
    const { onOpenDetection } = renderTyping('ab', spanish);

    expect(screen.getByText(/Aún no hemos identificado la forma de tu teclado/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Identificar forma' }));
    expect(onOpenDetection).toHaveBeenCalledTimes(1);
  });

  it('advances positions, records correct and incorrect keystrokes, accuracy and speed', () => {
    const { input, onComplete, onError, onExpectedKeyChange } = renderTyping('ñá');

    expect(onExpectedKeyChange).toHaveBeenLastCalledWith('ñ');
    expect(getKeyboardGuideKeysForExpectedKey('ñ', spanish.id)).toContain('P39');
    expect(getHandReferencesForExpectedKey('ñ', spanish.id).right).not.toContain('reposo');

    press(input, 'x', 'KeyX');
    press(input, 'Dead', 'Quote');
    press(input, 'a', 'KeyA');
    act(() => jest.advanceTimersByTime(200));

    expect(onError).toHaveBeenCalledWith('x', 'ñ');
    expect(onExpectedKeyChange).toHaveBeenLastCalledWith(null);
    const stats = onComplete.mock.calls[0][0] as TypingStats;
    expect(stats.correctChars).toBe(1);
    expect(stats.totalChars).toBe(2);
    expect(stats.accuracy).toBe(50);
    expect(stats.grossWpm).toBeGreaterThan(0);
    expect(stats.netWpm).toBe(Math.round(stats.grossWpm * 0.5 ** 3));
    expect(stats.score).toBe(stats.netWpm * 100);
    expect(stats.keystrokes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'x', correct: false, expected: 'ñ', position: 0 }),
        expect.objectContaining({ key: 'á', correct: true, expected: 'á', position: 1 }),
      ]),
    );
  });

  it('starts telemetry before recording the first keyboard event', () => {
    const { input, onComplete } = renderTyping('a');

    press(input, 'a', 'KeyA');
    act(() => jest.advanceTimersByTime(200));

    const stats = onComplete.mock.calls[0][0] as TypingStats;
    expect(stats.telemetry?.startedAt).not.toBeNull();
    expect(stats.telemetry?.events[0].timestamp).toBeGreaterThanOrEqual(
      stats.telemetry?.startedAt ?? Infinity,
    );
  });

  it('does not retain a corrected typo in the final error history', () => {
    const { input, onComplete } = renderTyping('a');

    press(input, 'x', 'KeyX');
    press(input, 'Backspace', 'Backspace');
    press(input, 'a', 'KeyA');
    act(() => jest.advanceTimersByTime(200));

    const stats = onComplete.mock.calls[0][0] as TypingStats;
    expect(stats.accuracy).toBe(100);
    expect(stats.keystrokes).toEqual([
      expect.objectContaining({ key: 'a', correct: true, expected: 'a', position: 0 }),
    ]);
  });

  it('muestra el carácter escrito dentro del recuadro de error', () => {
    const { input } = renderTyping('ñ');

    press(input, 'x', 'KeyX');

    const typedCharacter = screen.getByText('x');
    expect(typedCharacter.className).toContain('bg-(--accent-red-bg)');
    expect(screen.queryByText('ñ')).toBeNull();
  });

  it.each([
    ['á', 'a', 'KeyA', 'Quote', spanish],
    ['é', 'e', 'KeyE', 'Quote', spanish],
    ['í', 'i', 'KeyI', 'Quote', spanish],
    ['ó', 'o', 'KeyO', 'Quote', spanish],
    ['ú', 'u', 'KeyU', 'Quote', spanish],
    ['ü', 'u', 'KeyU', 'Quote', spanish, true],
    ['Á', 'A', 'KeyA', 'Quote', spanish, false, true],
    ['É', 'E', 'KeyE', 'Quote', spanish, false, true],
    ['Í', 'I', 'KeyI', 'Quote', spanish, false, true],
    ['Ó', 'O', 'KeyO', 'Quote', spanish, false, true],
    ['Ú', 'U', 'KeyU', 'Quote', spanish, false, true],
    ['Ü', 'U', 'KeyU', 'Quote', spanish, true, true],
    ['á', 'a', 'KeyA', 'BracketLeft', latam],
  ])('accepts dead-key composition for %s on %s', (expected, baseKey, baseCode, deadCode, layout, diaeresis = false, uppercase = false) => {
    const { input, onComplete } = renderTyping(expected, layout);
    press(input, 'Dead', deadCode, diaeresis);
    if (uppercase) press(input, 'Shift', 'ShiftLeft', true);
    press(input, baseKey, baseCode, uppercase);
    act(() => jest.advanceTimersByTime(200));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ correctChars: 1, accuracy: 100 }));
  });

  it.each([
    ['ñ', 'Ñ', 'Semicolon', false],
    ['Ñ', 'ñ', 'Semicolon', true],
    ['¿', '¡', 'Equal', true],
    ['¡', '¿', 'Equal', false],
  ])('accepts Spanish layout character %s', (expected, key, code, shiftKey) => {
    const { input, onComplete } = renderTyping(expected, spanish);
    if (shiftKey) press(input, 'Shift', 'ShiftLeft', true);
    press(input, key, code, shiftKey);
    act(() => jest.advanceTimersByTime(200));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ correctChars: 1 }));
    expect(getKeyboardGuideKeysForExpectedKey(expected, spanish.id)).not.toHaveLength(0);
  });
});
