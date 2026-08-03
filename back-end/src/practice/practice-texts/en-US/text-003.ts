// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'en-text-003',
  language: LanguageCode.en,
  content:
    'The Grand Canyon was carved mainly by the Colorado River over millions of years. Its exposed rock layers preserve a long record of Earth\'s geological past. Light and weather constantly change the colors visible along the canyon walls.',
};
