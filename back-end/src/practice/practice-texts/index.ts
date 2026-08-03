import { LanguageCode } from '@prisma/client';

import { csPracticeTexts } from './cs';
import { daPracticeTexts } from './da';
import { dePracticeTexts } from './de';
import { enPracticeTexts } from './en-US';
import { esPracticeTexts } from './es-latam';
import { ptPracticeTexts } from './pt';
import { frPracticeTexts } from './fr';
import { hrPracticeTexts } from './hr';
import { huPracticeTexts } from './hu';
import { itPracticeTexts } from './it';
import { nlPracticeTexts } from './nl';
import { noPracticeTexts } from './no';
import { plPracticeTexts } from './pl';
import { roPracticeTexts } from './ro';
import { svPracticeTexts } from './sv';
import { trPracticeTexts } from './tr';
import type { PracticeText } from './types';

export const freePracticeTextsByLanguage: Record<LanguageCode, PracticeText[]> = {
  [LanguageCode.es]: esPracticeTexts,
  [LanguageCode.en]: enPracticeTexts,
  [LanguageCode.pt]: ptPracticeTexts,
  [LanguageCode.fr]: frPracticeTexts,
  [LanguageCode.cs]: csPracticeTexts,
  [LanguageCode.da]: daPracticeTexts,
  [LanguageCode.de]: dePracticeTexts,
  [LanguageCode.hr]: hrPracticeTexts,
  [LanguageCode.hu]: huPracticeTexts,
  [LanguageCode.it]: itPracticeTexts,
  [LanguageCode.nl]: nlPracticeTexts,
  [LanguageCode.no]: noPracticeTexts,
  [LanguageCode.pl]: plPracticeTexts,
  [LanguageCode.ro]: roPracticeTexts,
  [LanguageCode.sv]: svPracticeTexts,
  [LanguageCode.tr]: trPracticeTexts,
};

function chooseText<T extends { id: string }>(texts: T[], excludedIds: string[]): T {
  const excluded = new Set(excludedIds);
  let candidates = texts.filter((text) => !excluded.has(text.id));

  if (candidates.length === 0) {
    const lastDeliveredId = excludedIds[excludedIds.length - 1];
    candidates = texts.filter((text) => text.id !== lastDeliveredId);
  }

  if (candidates.length === 0) {
    candidates = texts;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export function getFallbackPracticeText(
  language: LanguageCode,
  excludedIds: string[] = [],
): PracticeText {
  return chooseText(freePracticeTextsByLanguage[language], excludedIds);
}

export function getRandomPracticeText<T extends { id: string }>(
  texts: T[],
  excludedIds: string[] = [],
): T {
  return chooseText(texts, excludedIds);
}
