import { describe, expect, it } from '@jest/globals';

import { getTranslation } from './i18n';
import { SUPPORTED_LOCALES } from './locales';
import { PRACTICE_SEO_CONTENT } from './practiceSeoContent';
import { COURSE_QUESTIONS, LESSON_LABELS, PRACTICE_QUESTIONS } from './publicCitationContent';

describe('public editorial SEO copy', () => {
  it('renders the KisoDesk brand consistently in public metadata', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const titles = [
        getTranslation(locale, 'public.practice.metadata.title'),
        getTranslation(locale, 'public.courses.metadata.title'),
        getTranslation(locale, 'public.ranking.metadata.title'),
      ];

      for (const title of titles) {
        expect(title).not.toMatch(/\bKiso\s+Desk\b|\bKisodesk\b|\bKISO\s+DESK\b/);
        expect(title).toContain('KisoDesk');
      }
    }
  });

  it('keeps public practice titles aligned with the localized H1 intent', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const metadataTitle = getTranslation(locale, 'public.practice.metadata.title');
      const h1 = PRACTICE_SEO_CONTENT[locale].title;

      expect(metadataTitle).toContain('KisoDesk');
      expect(h1.trim().length).toBeGreaterThan(10);
      expect(PRACTICE_SEO_CONTENT[locale].metrics.trim().length).toBeGreaterThan(20);
      expect(PRACTICE_SEO_CONTENT[locale].intro).not.toMatch(/free|gratis|gratuit|kostenlos/i);
    }
  });

  it('preserves regional English, Spanish, and Portuguese wording', () => {
    expect(PRACTICE_SEO_CONTENT['en-US'].metrics).not.toBe(PRACTICE_SEO_CONTENT['en-GB'].metrics);
    expect(PRACTICE_SEO_CONTENT['es-ES'].intro).not.toBe(PRACTICE_SEO_CONTENT['es-latam'].intro);
    expect(getTranslation('pt-BR', 'practice.general.title')).toMatch(/digitação/i);
    expect(getTranslation('pt-PT', 'practice.general.title')).toMatch(/escrita/i);
  });

  it('does not contain Danish characters in the English (UK) public practice copy', () => {
    const englishUkCopy = [
      getTranslation('en-GB', 'public.practice.metadata.title'),
      getTranslation('en-GB', 'public.practice.metadata.description'),
      PRACTICE_SEO_CONTENT['en-GB'].title,
      PRACTICE_SEO_CONTENT['en-GB'].intro,
      PRACTICE_SEO_CONTENT['en-GB'].metrics,
    ].join(' ');

    expect(englishUkCopy).not.toMatch(/[æøå]/i);
  });

  it('provides direct, localized questions for every public SSR source', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(
        Object.values(PRACTICE_QUESTIONS[locale]).every((value) => value.trim().length > 10),
      ).toBe(true);
      expect(
        Object.values(COURSE_QUESTIONS[locale]).every((value) => value.trim().length > 10),
      ).toBe(true);
      expect(Object.values(LESSON_LABELS[locale]).every((value) => value.trim().length > 4)).toBe(
        true,
      );
    }

    expect(PRACTICE_QUESTIONS['es-latam'].metrics).toContain('WPM, PPM y precisión');
    expect(COURSE_QUESTIONS['es-latam'].typingVsSpelling).toContain('mecanografía y ortografía');
  });
});
