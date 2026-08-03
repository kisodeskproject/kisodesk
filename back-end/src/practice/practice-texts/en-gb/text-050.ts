// texto-050.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text050: PracticeText = {
  id: 'en-text-050',
  language: LanguageCode.en,
  content:
    'A museum charges £14.50 for an adult ticket and £8.25 for a child ticket. Two adults and three children pay £53.75 altogether.',
};
