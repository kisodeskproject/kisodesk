// text-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'fr-text-005',
  language: LanguageCode.fr,
  content:
    'La tour Eiffel se dilate légèrement lorsqu\'il fait chaud, car le métal réagit aux variations de température. Sa hauteur peut donc changer de quelques centimètres entre une journée froide et une période de forte chaleur.',
};
