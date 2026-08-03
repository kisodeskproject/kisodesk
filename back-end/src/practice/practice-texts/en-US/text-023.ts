// texto-023.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text023: PracticeText = {
  id: 'en-text-023',
  language: LanguageCode.en,
  content:
    'Use an apostrophe to show possession or omitted letters. The dog\'s collar shows possession, while don\'t represents do not. Plural nouns usually do not need an apostrophe, so write books, cameras, and ideas without one.',
};
