import { describe, expect, it } from '@jest/globals';

import {
  getCharacterForPhysicalKey,
  getSvgKeyIdForPhysicalKeyId,
  resolveCharacterToPhysicalKey,
} from './keyMappings';
import { getEnabledLayouts, getEnabledLayoutById, getKeyOutput } from './keyboardLayouts';
import { physicalFamilyHasKeyId } from './keyboardPhysical';

describe('physical key resolution', () => {
  it('uses the selected layout and Shift state', () => {
    expect(getCharacterForPhysicalKey('P39' as never, 'qwerty-da')).toBe('æ');
    expect(getCharacterForPhysicalKey('P39' as never, 'qwerty-da', true)).toBe('Æ');
    expect(getCharacterForPhysicalKey('P40' as never, 'qwerty-da')).toBe('ø');
    expect(getCharacterForPhysicalKey('P26' as never, 'qwerty-da')).toBe('å');
    expect(getCharacterForPhysicalKey('P39' as never, 'qwertz', true)).toBe('Ö');
    expect(getCharacterForPhysicalKey('P40' as never, 'qwertz', true)).toBe('Ä');
    expect(getCharacterForPhysicalKey('P40' as never, 'qwerty-tr', true)).toBe('İ');
    expect(getCharacterForPhysicalKey('P23' as never, 'qwerty-tr')).toBe('ı');
    expect(getCharacterForPhysicalKey('P23' as never, 'qwerty-tr', true)).toBe('I');
  });

  it.each([
    ['ñ', 'qwerty-latam', 'P39', false],
    ['ò', 'qwerty-it', 'P39', false],
    ['z', 'qwertz', 'P21', false],
    ['y', 'qwertz', 'P44', false],
    ['Æ', 'qwerty-da', 'P39', true],
  ])('resolves %s to its physical key for %s', (character, layoutId, physicalKeyId, requiresShift) => {
    const layout = getEnabledLayoutById(layoutId);

    expect(resolveCharacterToPhysicalKey(character, layout)).toMatchObject({
      physicalKeyId,
      displayValue: character,
      requiresShift,
    });
  });

  it('uses one SVG identity for a physical position across layouts', () => {
    expect(getSvgKeyIdForPhysicalKeyId('P39' as never)).toBe('key-P39');
  });

  it('selects the opposite physical Shift key', () => {
    expect(resolveCharacterToPhysicalKey('A', getEnabledLayoutById('qwerty-en'))).toMatchObject({
      physicalKeyId: 'P30',
      shiftPhysicalKeyId: 'P55',
    });
    expect(resolveCharacterToPhysicalKey('Z', getEnabledLayoutById('qwertz'))).toMatchObject({
      physicalKeyId: 'P21',
      shiftPhysicalKeyId: 'P42',
    });
  });

  it.each(getEnabledLayouts())('resolves every configured layer to an available physical key for $id', (layout) => {
    const outputs = new Set<string>();
    Object.keys(layout.keys).forEach((physicalKeyId) => {
      [false, true].forEach((shiftKey) => {
        [false, true].forEach((altGrKey) => {
          const output = getKeyOutput(layout, physicalKeyId as never, shiftKey, altGrKey);
          if (output) outputs.add(output.normalize('NFC'));
        });
      });
    });

    outputs.forEach((character) => {
      const resolution = resolveCharacterToPhysicalKey(character, layout);
      expect(resolution).not.toBeNull();
      expect(physicalFamilyHasKeyId(layout.physicalType ?? 'ISO', resolution!.physicalKeyId)).toBe(true);
      expect(getSvgKeyIdForPhysicalKeyId(resolution!.physicalKeyId, layout.physicalType ?? 'ISO')).not.toBeNull();
    });
  });

  it.each(getEnabledLayouts())('resolves every configured dead-key composition for $id', (layout) => {
    for (const deadKey of layout.deadKeys ?? []) {
      for (const physicalKeyId of Object.keys(layout.keys)) {
        for (const shiftKey of [false, true]) {
          const base = getKeyOutput(layout, physicalKeyId as never, shiftKey);
          if (!base) continue;
          const character = `${base}${deadKey.combiningMark}`.normalize('NFC');
          const resolution = resolveCharacterToPhysicalKey(character, layout);
          expect(resolution).not.toBeNull();
          // Algunos caracteres ya existen en una tecla directa; ambos caminos
          // son resoluciones válidas para el mismo carácter NFC.
          if (resolution?.deadKey) {
            expect(resolution.deadKey.physicalKeyId).toBe(deadKey.physicalKeyId);
          }
        }
      }
    }
  });
});
