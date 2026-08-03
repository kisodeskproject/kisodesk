// texto-004.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text004: PracticeText = {
  id: 'en-text-004',
  language: LanguageCode.en,
  content:
    'Ben Nevis is the highest mountain in the United Kingdom. It rises in the Scottish Highlands near Fort William. Walkers often experience rapid changes in visibility, wind and temperature as they climb towards the summit.',
};
