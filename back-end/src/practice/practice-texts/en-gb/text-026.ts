// texto-026.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text026: PracticeText = {
  id: 'en-text-026',
  language: LanguageCode.en,
  content:
    'Use an apostrophe to show possession or missing letters. The student\'s notes belong to one student, while the students\' notes belong to several. Don\'t is a contraction of do not.',
};
