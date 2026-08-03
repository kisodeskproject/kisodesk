// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'en-text-100',
  language: LanguageCode.en,
  content:
    'British fashion has moved between formal tailoring, street style, royal ceremony and rebellious youth movements. Designers and subcultures have repeatedly turned clothing into a visible statement about class, music and identity.',
};
