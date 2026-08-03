// texto-025.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text025: PracticeText = {
  id: 'de-text-025',
  language: LanguageCode.de,
  content:
    'Am Satzanfang und nach einem Punkt beginnt das erste Wort mit einem Großbuchstaben. Eigennamen, Länder, Städte und Personen werden ebenfalls großgeschrieben.',
};
