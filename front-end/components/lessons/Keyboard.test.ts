import { describe, expect, it } from '@jest/globals';

import {
  getKeyboardSvgData,
  KEYBOARD_GEOMETRY_BY_FAMILY,
  resolveKeyboardPressOutput,
  resolveKeyboardVisualKey,
} from './Keyboard';
import { getEnabledLayouts, getKeyOutput } from '@/lib/keyboardLayouts';
import { resolveCharacterToPhysicalKey } from '@/lib/keyMappings';
import { getPhysicalKeyIdForCode } from '@/lib/keyboardPhysical';

const physicalKey = (code: string) => getPhysicalKeyIdForCode(code)!;
const CONTROL_LABELS: Record<string, string> = {
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
  P61: 'AltGr',
};

describe('keyboard SVG layouts', () => {
  it('keeps independent geometry configurations for every physical family', () => {
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ANSI).not.toBe(KEYBOARD_GEOMETRY_BY_FAMILY.ISO);
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ISO).not.toBe(KEYBOARD_GEOMETRY_BY_FAMILY.ABNT2);
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ISO.KEY_UNITS).not.toBe(
      KEYBOARD_GEOMETRY_BY_FAMILY.ANSI.KEY_UNITS,
    );
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.ABNT2.PHYSICAL_KEY_UNITS).not.toBe(
      KEYBOARD_GEOMETRY_BY_FAMILY.ISO.PHYSICAL_KEY_UNITS,
    );
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.JIS).not.toBe(KEYBOARD_GEOMETRY_BY_FAMILY.ANSI);
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.KS).not.toBe(KEYBOARD_GEOMETRY_BY_FAMILY.ANSI);
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.JIS.PHYSICAL_KEY_UNITS).not.toBe(
      KEYBOARD_GEOMETRY_BY_FAMILY.KS.PHYSICAL_KEY_UNITS,
    );
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.BIG_ASS).not.toBe(KEYBOARD_GEOMETRY_BY_FAMILY.ISO);
    expect(KEYBOARD_GEOMETRY_BY_FAMILY.BIG_ASS.ENTER.form).toBe('big-ass');
  });

  it('normalizes the legacy ABNT family before resolving physical rows', () => {
    const keyboard = getKeyboardSvgData('qwerty-br', 'ABNT' as never);

    expect(keyboard.physicalFamily).toBe('ABNT2');
    expect(keyboard.keyIdRows).toHaveLength(5);
  });

  it.each(getEnabledLayouts())('renders the labels configured for $id', (layout) => {
    const { keyIdRows, rows } = getKeyboardSvgData(layout.id);

    keyIdRows.forEach((row, rowIndex) => {
      row.forEach((physicalKeyId, columnIndex) => {
        const expectedLabel =
          CONTROL_LABELS[physicalKeyId] ?? getKeyOutput(layout, physicalKeyId) ?? physicalKeyId;
        expect(rows[rowIndex][columnIndex]).toBe(expectedLabel);
      });
    });
  });

  it('resolves the highlighted and emitted key from code, not the operating-system label', () => {
    expect(resolveKeyboardVisualKey('qwerty-da', physicalKey('Semicolon'))).toBe('æ');
    expect(resolveKeyboardPressOutput('qwerty-da', physicalKey('Semicolon'), true, 'Ñ')).toBe('Æ');
    expect(resolveKeyboardVisualKey('qwerty-da', physicalKey('Quote'))).toBe('ø');
    expect(resolveKeyboardPressOutput('qwerty-da', physicalKey('Quote'), false, 'Dead')).toBe('ø');
  });

  it('preserves the Italian space and Enter geometry controls', () => {
    const { keyIdRows, rows } = getKeyboardSvgData('qwerty-it');

    expect(keyIdRows).toEqual(getKeyboardSvgData('qwerty-latam').keyIdRows);
    expect(rows[2]).toContain('Enter');
    expect(rows[4]).toContain('Space');
  });

  it.each(getEnabledLayouts())(
    'gives every layout character a physical SVG key for $id',
    (layout) => {
      const { keyIdRows } = getKeyboardSvgData(layout.id);
      const svgKeyIds = new Set(keyIdRows.flat());

      Object.keys(layout.keys).forEach((physicalKeyId) => {
        for (const shiftKey of [false, true]) {
          const character = getKeyOutput(layout, physicalKeyId as never, shiftKey);
          if (!character) continue;
          const physicalKey = resolveCharacterToPhysicalKey(character, layout);
          expect(physicalKey).not.toBeNull();
          expect(svgKeyIds).toContain(physicalKey?.physicalKeyId);
        }
      });
    },
  );
});
