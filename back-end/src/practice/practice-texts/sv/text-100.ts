// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'sv-text-100',
  language: LanguageCode.sv,
  content:
    'Midsommar, lucia och kräftskivor förekommer ofta i svensk film, television och reklam. Traditionerna används som tydliga kulturella symboler.',
};
