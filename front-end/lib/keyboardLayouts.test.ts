import { describe, expect, it } from '@jest/globals';

import {
  KEYBOARD_LAYOUTS,
  getDefaultLayoutForLanguage,
  getDefaultLayoutForLocale,
  getEnabledLayoutById,
  getEnabledLayoutsForLocale,
  getKeyboardLayoutCompatibility,
  resolveKeyboardLayout,
} from './keyboardLayouts';
import { getVisualKeyForPhysicalKeyId } from './keyMappings';
import { getPhysicalKeyIdForCode } from './keyboardPhysical';
import { SUPPORTED_LOCALES } from './locales';

describe('keyboard layout resolution', () => {
  it('usa distribuciones predeterminadas por idioma cuando no hay selección explícita', () => {
    expect(getDefaultLayoutForLanguage('es').id).toBe('qwerty-latam');
    expect(getDefaultLayoutForLanguage('en').id).toBe('qwerty-en');
    expect(getDefaultLayoutForLanguage('cs').id).toBe('qwertz-cs');
    expect(getDefaultLayoutForLanguage('tr').id).toBe('qwerty-tr');
  });

  it('considera la región del idioma del navegador', () => {
    expect(getDefaultLayoutForLocale('es-ES')).toHaveProperty('id', 'qwerty-es');
    expect(getDefaultLayoutForLocale('es-MX')).toHaveProperty('id', 'qwerty-latam');
    expect(getDefaultLayoutForLocale('en-GB')).toHaveProperty('id', 'qwerty-uk');
    expect(getDefaultLayoutForLocale('pt-BR')).toHaveProperty('id', 'qwerty-br');
  });

  it('asigna al menos una distribución habilitada a cada idioma de interfaz', () => {
    const enabledLayouts = KEYBOARD_LAYOUTS.filter((layout) => layout.enabled);
    const assignedLocales = new Set(enabledLayouts.flatMap((layout) => layout.languageCodes));

    expect(assignedLocales).toEqual(new Set(SUPPORTED_LOCALES));
  });

  it('conserva la selección explícita y usa español como fallback seguro', () => {
    expect(resolveKeyboardLayout({ layoutId: 'qwerty-latam', language: 'en' }).id).toBe(
      'qwerty-latam',
    );
    expect(resolveKeyboardLayout({ layoutId: 'unknown-layout', language: 'unknown' }).id).toBe(
      'qwerty-latam',
    );
  });

  it('ordena las distribuciones lógicas del idioma por compatibilidad física', () => {
    const layouts = getEnabledLayoutsForLocale('es-latam', 'ANSI');

    expect(layouts).toHaveLength(1);
    expect(layouts[0].layout.id).toBe('qwerty-latam');
    expect(layouts[0].compatible).toBe(false);
    expect(layouts[0].missingPhysicalKeyIds).toContain('P43');
  });

  it('evalúa compatibilidad por posiciones físicas, no por idioma ni caracteres', () => {
    expect(
      getKeyboardLayoutCompatibility(getEnabledLayoutById('qwerty-en'), 'ISO').compatible,
    ).toBe(true);
    expect(
      getKeyboardLayoutCompatibility(getEnabledLayoutById('qwerty-latam'), 'ISO').compatible,
    ).toBe(true);
  });

  it('separa código físico y etiqueta visual de la distribución activa', () => {
    expect(getVisualKeyForPhysicalKeyId(getPhysicalKeyIdForCode('Semicolon')!, 'qwerty-es')).toBe('ñ');
    expect(getVisualKeyForPhysicalKeyId(getPhysicalKeyIdForCode('Quote')!, 'qwerty-es')).toBe('´');
    expect(getVisualKeyForPhysicalKeyId(getPhysicalKeyIdForCode('Semicolon')!, 'qwerty-latam')).toBe('ñ');
    expect(getVisualKeyForPhysicalKeyId(getPhysicalKeyIdForCode('BracketLeft')!, 'qwerty-latam')).toBe('´');
    expect(getVisualKeyForPhysicalKeyId(getPhysicalKeyIdForCode('Digit2')!, 'qwerty-en')).toBe('2');
  });

  it.each([
    'qwerty-pt', 'qwerty-it', 'qwerty-br',
    'qwertz-cs', 'qwerty-da', 'qwertz-hr', 'qwertz-hu', 'qwerty-nl', 'qwerty-no',
    'qwerty-pl', 'qwerty-ro', 'qwerty-sv', 'qwerty-tr',
  ] as const)(
    'incluye la distribución %s',
    (layoutId) => {
      expect(getEnabledLayoutById(layoutId).id).toBe(layoutId);
    },
  );
});
