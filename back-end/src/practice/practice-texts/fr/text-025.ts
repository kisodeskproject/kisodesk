// text-025.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text025: PracticeText = {
  id: 'fr-text-025',
  language: LanguageCode.fr,
  content:
    'Un adjectif s\'accorde normalement en genre et en nombre avec le nom qu\'il qualifie. On écrit un exercice difficile, une question difficile, des exercices difficiles et des questions difficiles.',
};
