import { describe, expect, it } from '@jest/globals';

import { getKeyboardGuideKeysForExpectedKey } from './index';

describe('keyboard guide key resolution', () => {
  it('resuelve las guías españolas a códigos físicos', () => {
    expect(getKeyboardGuideKeysForExpectedKey('ñ', 'qwerty-es')).toEqual(['P39']);
    expect(getKeyboardGuideKeysForExpectedKey('Ñ', 'qwerty-es')).toEqual(['P42', 'P39']);
    expect(getKeyboardGuideKeysForExpectedKey('á', 'qwerty-es')).toEqual(['P40', 'P30']);
    expect(getKeyboardGuideKeysForExpectedKey('é', 'qwerty-es')).toEqual(['P40', 'P18']);
    expect(getKeyboardGuideKeysForExpectedKey('í', 'qwerty-es')).toEqual(['P40', 'P23']);
    expect(getKeyboardGuideKeysForExpectedKey('ó', 'qwerty-es')).toEqual(['P40', 'P24']);
    expect(getKeyboardGuideKeysForExpectedKey('ú', 'qwerty-es')).toEqual(['P40', 'P22']);
    expect(getKeyboardGuideKeysForExpectedKey('ü', 'qwerty-es')).toEqual([
      'P42', 'P40', 'P22',
    ]);
    expect(getKeyboardGuideKeysForExpectedKey('¡', 'qwerty-es')).toEqual(['P13']);
    expect(getKeyboardGuideKeysForExpectedKey('¿', 'qwerty-es')).toEqual(['P42', 'P13']);
  });

  it('mantiene las guías de caracteres españoles en QWERTY latinoamericano', () => {
    expect(getKeyboardGuideKeysForExpectedKey('ñ', 'qwerty-latam')).toEqual(['P39']);
    expect(getKeyboardGuideKeysForExpectedKey('á', 'qwerty-latam')).toEqual(['P26', 'P30']);
    expect(getKeyboardGuideKeysForExpectedKey('ü', 'qwerty-latam')).toEqual([
      'P42', 'P26', 'P22',
    ]);
    expect(getKeyboardGuideKeysForExpectedKey('¡', 'qwerty-latam')).toEqual(['P42', 'P13']);
    expect(getKeyboardGuideKeysForExpectedKey('¿', 'qwerty-latam')).toEqual(['P13']);
  });

  it('resalta las teclas físicas correctas para símbolos ingleses', () => {
    expect(getKeyboardGuideKeysForExpectedKey('@', 'qwerty-en')).toEqual(['P55', 'P03']);
    expect(getKeyboardGuideKeysForExpectedKey('?', 'qwerty-en')).toEqual(['P42', 'P53']);
  });

  it('resalta los caracteres propios del teclado danés', () => {
    expect(getKeyboardGuideKeysForExpectedKey('æ', 'qwerty-da')).toEqual(['P39']);
    expect(getKeyboardGuideKeysForExpectedKey('Æ', 'qwerty-da')).toEqual(['P42', 'P39']);
    expect(getKeyboardGuideKeysForExpectedKey('ø', 'qwerty-da')).toEqual(['P40']);
    expect(getKeyboardGuideKeysForExpectedKey('å', 'qwerty-da')).toEqual(['P26']);
  });
});
