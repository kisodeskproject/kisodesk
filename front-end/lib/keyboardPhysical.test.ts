import { describe, expect, it } from '@jest/globals';

import { getSvgKeyIdForPhysicalKeyId } from './keyMappings';
import {
  PHYSICAL_KEY_ID_ROWS,
  getCodeForPhysicalKeyId,
  getPhysicalKeyIdForCode,
  physicalFamilyHasCode,
} from './keyboardPhysical';

describe('keyboard physical families', () => {
  it('keeps independent code rows for every physical family', () => {
    expect(PHYSICAL_KEY_ID_ROWS.ANSI).not.toBe(PHYSICAL_KEY_ID_ROWS.ISO);
    expect(PHYSICAL_KEY_ID_ROWS.ISO).not.toBe(PHYSICAL_KEY_ID_ROWS.ABNT2);
    expect(PHYSICAL_KEY_ID_ROWS.JIS).not.toBe(PHYSICAL_KEY_ID_ROWS.ANSI);
    expect(PHYSICAL_KEY_ID_ROWS.KS).not.toBe(PHYSICAL_KEY_ID_ROWS.ANSI);
    expect(PHYSICAL_KEY_ID_ROWS.BIG_ASS).not.toBe(PHYSICAL_KEY_ID_ROWS.ISO);
  });

  it('exposes only the physical keys present in each family', () => {
    expect(physicalFamilyHasCode('ANSI', 'IntlBackslash')).toBe(false);
    expect(physicalFamilyHasCode('ANSI', 'IntlRo')).toBe(false);
    expect(physicalFamilyHasCode('ISO', 'IntlBackslash')).toBe(true);
    expect(physicalFamilyHasCode('ISO', 'IntlRo')).toBe(false);
    expect(physicalFamilyHasCode('ABNT2', 'IntlBackslash')).toBe(true);
    expect(physicalFamilyHasCode('ABNT2', 'IntlRo')).toBe(true);
    expect(physicalFamilyHasCode('JIS', 'IntlYen')).toBe(true);
    expect(physicalFamilyHasCode('JIS', 'IntlBackslash')).toBe(false);
    expect(physicalFamilyHasCode('KS', 'IntlYen')).toBe(true);
    expect(physicalFamilyHasCode('KS', 'IntlRo')).toBe(false);
    expect(physicalFamilyHasCode('BIG_ASS', 'IntlBackslash')).toBe(true);
    expect(physicalFamilyHasCode('BIG_ASS', 'IntlRo')).toBe(false);
  });

  it('keeps the complete ANSI bottom row in physical order', () => {
    expect(PHYSICAL_KEY_ID_ROWS.ANSI[4]).toEqual([
      'P56',
      'P57',
      'P58',
      'P59',
      'P60',
      'P64',
      'P62',
      'P63',
    ]);
  });

  it('never returns an SVG id for a key absent from the selected family', () => {
    expect(getSvgKeyIdForPhysicalKeyId('P43' as never, 'ANSI')).toBeNull();
    expect(getSvgKeyIdForPhysicalKeyId('P54' as never, 'ISO')).toBeNull();
    expect(getSvgKeyIdForPhysicalKeyId('P54' as never, 'ABNT2')).toBe('key-P54');
  });

  it('maps browser codes to stable physical positions', () => {
    expect(getPhysicalKeyIdForCode('Semicolon')).toBe('P39');
    expect(getPhysicalKeyIdForCode('ShiftLeft')).toBe('P42');
    expect(getPhysicalKeyIdForCode('IntlBackslash')).toBe('P43');
    expect(getPhysicalKeyIdForCode('IntlRo')).toBe('P54');
    expect(getCodeForPhysicalKeyId('P39' as never)).toBe('Semicolon');
  });
});
