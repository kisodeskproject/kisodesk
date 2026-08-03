import { describe, expect, it } from '@jest/globals';

import { SUPPORTED_LOCALES } from './locales';
import { PRACTICE_SEO_CONTENT } from './practiceSeoContent';
import { getTranslation } from './i18n';

describe('PRACTICE_SEO_CONTENT', () => {
  it('provides complete visible practice guidance for every supported locale', () => {
    expect(Object.keys(PRACTICE_SEO_CONTENT).sort()).toEqual([...SUPPORTED_LOCALES].sort());

    for (const locale of SUPPORTED_LOCALES) {
      for (const value of Object.values(PRACTICE_SEO_CONTENT[locale])) {
        expect(value.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('aligns the Latin American Spanish title, H1, and visible speed metrics', () => {
    expect(getTranslation('es-latam', 'public.practice.metadata.title')).toBe(
      'Prueba de velocidad de escritura y precisión | KisoDesk',
    );
    expect(PRACTICE_SEO_CONTENT['es-latam'].title).toBe('Prueba de velocidad de escritura');
    expect(PRACTICE_SEO_CONTENT['es-latam'].metrics).toContain('WPM');
    expect(PRACTICE_SEO_CONTENT['es-latam'].metrics).toContain('PPM');
    expect(PRACTICE_SEO_CONTENT['es-latam'].metrics).toContain('precisión');
  });
});
