import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import Keyboard, { KEYBOARD_GEOMETRY_BY_FAMILY } from './Keyboard';
import { KeyboardLayoutContext } from '@/contexts/KeyboardLayoutContext';
import { getEnabledLayoutById } from '@/lib/keyboardLayouts';
import { getPhysicalKeyIdForCode, type PhysicalKeyId } from '@/lib/keyboardPhysical';

let physicalFamily: 'ANSI' | 'ISO' | 'ABNT2' | 'JIS' | 'KS' | 'BIG_ASS' = 'ISO';

jest.mock('next/navigation', () => ({ useParams: () => ({ lang: 'es-latam' }) }));
function renderKeyboard(family: typeof physicalFamily, guideKeys: PhysicalKeyId[] = []) {
  physicalFamily = family;
  const layout = getEnabledLayoutById('qwerty-latam');
  return render(
    <KeyboardLayoutContext.Provider
      value={{
        selectedLayout: layout,
        layouts: [layout],
        isReady: true,
        hasLayoutPreference: true,
        isSaving: false,
        isDetectionOpen: false,
        setSelectedLayout: async () => undefined,
        openDetection: () => undefined,
        closeDetection: () => undefined,
        getLayoutForLanguage: () => layout,
        getLayoutsForLanguage: () => [layout],
        physicalFamily,
        hasPhysicalFamilyPreference: true,
        setPhysicalFamily: () => undefined,
      }}
    >
      <Keyboard layoutId="qwerty-latam" guideKeys={guideKeys} />
    </KeyboardLayoutContext.Provider>,
  );
}

function key(container: HTMLElement, id: string) {
  return container.querySelector(`[data-svg-key-id="${id}"]`);
}

function classes(node: Element) {
  return node.getAttribute('class') ?? '';
}

describe('Keyboard physical DOM and illumination', () => {
  beforeEach(() => {
    // These DOM tests do not exercise hand-SVG loading. Keep that asynchronous
    // work pending so it cannot update state after an individual assertion.
    global.fetch = jest.fn(
      () => new Promise<Response>(() => undefined),
    ) as unknown as typeof fetch;
  });

  it.each([
    ['ANSI', false, false],
    ['ISO', true, false],
    ['ABNT2', true, true],
    ['BIG_ASS', true, false],
    ['JIS', false, true],
    ['KS', false, false],
  ] as const)(
    'renders each physical SVG id exactly once for %s',
    (family, hasIntlBackslash, hasIntlRo) => {
      const { container } = renderKeyboard(family);
      const ids = [...container.querySelectorAll('[data-svg-key-id]')].map((node) =>
        node.getAttribute('data-svg-key-id'),
      );

      expect(new Set(ids).size).toBe(ids.length);
      expect(key(container, 'key-P43') !== null).toBe(hasIntlBackslash);
      expect(key(container, 'key-P54') !== null).toBe(hasIntlRo);
    },
  );

  it('keeps the ANSI Backspace, Tab and Caps Lock widths without overlapping their rows', () => {
    const { container } = renderKeyboard('ANSI');
    const rect = (physicalKeyId: string) => key(container, `key-${physicalKeyId}`)!;
    const width = (physicalKeyId: string) => Number(rect(physicalKeyId).getAttribute('width'));
    const height = (physicalKeyId: string) => Number(rect(physicalKeyId).getAttribute('height'));

    expect(width('P14')).toBeGreaterThan(width('P13'));
    expect(width('P15')).toBeGreaterThan(width('P16'));
    expect(width('P29')).toBeGreaterThan(width('P15'));
    expect(height('P14')).toBe(height('P13'));
    expect(height('P15')).toBe(height('P16'));
    expect(height('P29')).toBe(height('P30'));
    expect(width('P41')).toBeGreaterThan(width('P40'));
    expect(width('P42')).toBeGreaterThan(width('P44'));
    expect(width('P55')).toBeGreaterThan(width('P53'));
    expect(height('P41')).toBe(height('P40'));
    expect(height('P42')).toBe(height('P44'));
    expect(height('P55')).toBe(height('P53'));

    const rows = new Map<number, Array<{ x: number; width: number }>>();
    container.querySelectorAll<SVGRectElement>('[data-svg-key-id]').forEach((node) => {
      const y = Number(node.getAttribute('y'));
      const row = rows.get(y) ?? [];
      row.push({ x: Number(node.getAttribute('x')), width: Number(node.getAttribute('width')) });
      rows.set(y, row);
    });
    rows.forEach((row) => {
      const sorted = [...row].sort((left, right) => left.x - right.x);
      sorted.slice(1).forEach((current, index) => {
        expect(sorted[index].x + sorted[index].width).toBeLessThanOrEqual(current.x);
      });
    });
  });

  it('renders ANSI controls with display labels, never with PhysicalKeyId values', () => {
    const { container } = renderKeyboard('ANSI');
    const labels: Record<string, string> = {
      P14: 'Backspace',
      P15: 'Tab',
      P29: 'Caps Lock',
      P41: 'Enter',
      P42: 'Shift',
      P55: 'Shift',
      P56: 'Ctrl',
      P57: 'Fn',
      P58: 'Win',
      P59: 'Alt',
      P60: 'Space',
      P64: 'Alt',
      P62: 'Win',
      P63: 'Ctrl',
    };

    Object.entries(labels).forEach(([physicalKeyId, expected]) => {
      const control = key(container, `key-${physicalKeyId}`)!;
      expect(control.parentElement?.querySelector('text')?.textContent).toBe(expected);
    });
    expect(
      [...container.querySelectorAll('text')].some((node) => /^P\d+$/.test(node.textContent ?? '')),
    ).toBe(false);
  });

  it('renders ISO Enter, short left Shift and IntlBackslash without overlaps', () => {
    const { container } = renderKeyboard('ISO');
    const enter = key(container, 'key-P41')!;
    const shiftLeft = key(container, 'key-P42')!;
    const intlBackslash = key(container, 'key-P43')!;
    const keyZ = key(container, 'key-P44')!;

    expect(enter.tagName).toBe('path');
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ISO.ENTER.form).toBe('iso');
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ISO.PHYSICAL_KEY_UNITS['P42' as PhysicalKeyId]).toBe(1);
    expect(Number(shiftLeft.getAttribute('width'))).toBe(
      Number(intlBackslash.getAttribute('width')),
    );
    expect(Number(intlBackslash.getAttribute('x')) + Number(intlBackslash.getAttribute('width'))).toBeLessThanOrEqual(
      Number(keyZ.getAttribute('x')),
    );
  });

  it('keeps ISO bottom-row controls at the approved ANSI widths', () => {
    const units = KEYBOARD_GEOMETRY_BY_FAMILY.ISO.PHYSICAL_KEY_UNITS;

    expect(units['P56' as PhysicalKeyId]).toBe(1.25);
    expect(units['P57' as PhysicalKeyId]).toBe(1);
    expect(units['P58' as PhysicalKeyId]).toBe(1);
    expect(units['P59' as PhysicalKeyId]).toBe(1.5);
    expect(units['P64' as PhysicalKeyId]).toBe(1.5);
    expect(units['P62' as PhysicalKeyId]).toBe(1);
    expect(units['P63' as PhysicalKeyId]).toBe(1.25);
  });

  it('renders the ABNT2-only key before a short right Shift', () => {
    const { container } = renderKeyboard('ABNT2');
    const enter = key(container, 'key-P41')!;
    const intlRo = key(container, 'key-P54')!;
    const shiftRight = key(container, 'key-P55')!;

    expect(enter.tagName).toBe('path');
    expect(intlRo).not.toBeNull();
    expect(Number(intlRo.getAttribute('x')) + Number(intlRo.getAttribute('width'))).toBeLessThanOrEqual(
      Number(shiftRight.getAttribute('x')),
    );
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ABNT2.PHYSICAL_KEY_UNITS['P55' as PhysicalKeyId]).toBe(1.25);
  });

  it('renders the Big Ass Enter as a distinct inverted-L path', () => {
    const { container } = renderKeyboard('BIG_ASS');
    const enter = key(container, 'key-P41')!;

    expect(enter.tagName).toBe('path');
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.BIG_ASS.ENTER.form).toBe('big-ass');
  });

  async function dispatchKey(
    type: 'keydown' | 'keyup',
    code: string,
    keyValue: string,
    options: KeyboardEventInit = {},
  ) {
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent(type, { code, key: keyValue, bubbles: true, ...options }),
      );
    });
  }

  it('keeps the expected guide after an incorrect physical key and flashes that key red', async () => {
    const { container } = renderKeyboard('ISO', [getPhysicalKeyIdForCode('Semicolon')!]);
    await act(async () => {});
    const expected = key(container, 'key-P39')!;
    expect(classes(expected)).toContain('key-guide');

    await dispatchKey('keydown', 'KeyX', 'x');
    expect(classes(key(container, 'key-P45')!)).toContain('accent-red');
    expect(classes(expected)).toContain('key-guide');
  });

  it('flashes a correct physical key green', async () => {
    const { container } = renderKeyboard('ISO', [getPhysicalKeyIdForCode('Semicolon')!]);
    await act(async () => {});
    await dispatchKey('keydown', 'Semicolon', 'ñ');
    expect(classes(key(container, 'key-P39')!)).toContain('accent-green');
  });

  it('reveals the main key only while the required Shift is held', async () => {
    const { container } = renderKeyboard('ISO', [
      getPhysicalKeyIdForCode('ShiftLeft')!,
      getPhysicalKeyIdForCode('Digit2')!,
    ]);
    await act(async () => {});
    expect(classes(key(container, 'key-P42')!)).toContain('key-guide');
    expect(classes(key(container, 'key-P03')!)).not.toContain('key-guide');
    await dispatchKey('keydown', 'ShiftLeft', 'Shift');
    expect(classes(key(container, 'key-P03')!)).toContain('key-guide');
    await dispatchKey('keyup', 'ShiftLeft', 'Shift');
    expect(classes(key(container, 'key-P03')!)).not.toContain('key-guide');
  });

  it('renders AltGr guidance from physical codes', () => {
    const { container } = renderKeyboard('ISO', [
      getPhysicalKeyIdForCode('AltRight')!,
      getPhysicalKeyIdForCode('Digit2')!,
    ]);
    expect(classes(key(container, 'key-P61')!)).toContain('key-guide');
    expect(classes(key(container, 'key-P03')!)).toContain('key-guide');
  });
});
