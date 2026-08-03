import { describe, expect, it } from '@jest/globals';

import {
  getCanonicalLocale,
  getHtmlLang,
  getHrefLang,
  LOCALE_OPTIONS,
  resolveLocaleFromAcceptLanguage,
  toContentLanguage,
  toSupportedLocale,
} from './locales';

describe('locales', () => {
  it('shows only regional English and Spanish variants in the selector', () => {
    const visibleLocales = LOCALE_OPTIONS.map((language) => language.code);

    expect(visibleLocales).toEqual(expect.arrayContaining(['en-US', 'en-GB', 'es-ES', 'es-latam']));
    expect(visibleLocales).not.toEqual(expect.arrayContaining(['en', 'es']));
  });

  it('normalizes supported language and regional aliases', () => {
    expect(getCanonicalLocale('pt')).toBeNull();
    expect(getCanonicalLocale('en-US')).toBe('en-US');
    expect(getCanonicalLocale('pt-br')).toBe('pt-BR');
    expect(getCanonicalLocale('es-latam')).toBe('es-latam');
    expect(getCanonicalLocale('fr')).toBe('fr');
    expect(getCanonicalLocale('FR-fr')).toBe('fr');
    expect(toSupportedLocale('unknown')).toBe('es-latam');
  });

  it('uses valid hreflang tags without changing localized routes', () => {
    expect(getHrefLang('es-latam')).toBe('es');
    expect(getHtmlLang('es-latam')).toBe('es-419');
    expect(getHrefLang('en-US')).toBe('en-US');
  });

  it('negotiates the supported locale with the highest Accept-Language quality', () => {
    expect(resolveLocaleFromAcceptLanguage('de-DE,de;q=0.9,pt-BR;q=0.8,en;q=0.7')).toBe('de');
    expect(resolveLocaleFromAcceptLanguage('en-US;q=0.7,fr-FR;q=0.9')).toBe('fr');
  });

  it('maps regional interface variants to their content language', () => {
    expect(toContentLanguage('es-latam')).toBe('es');
    expect(toContentLanguage('es-ES')).toBe('es');
    expect(toContentLanguage('en-US')).toBe('en');
    expect(toContentLanguage('en-US')).toBe('en');
    expect(toContentLanguage('pt-BR')).toBe('pt');
    expect(toContentLanguage('fr')).toBe('fr');
    expect(toContentLanguage('tr')).toBe('tr');
  });
});
