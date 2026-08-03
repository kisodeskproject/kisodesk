// texto-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'hu-text-005',
  language: LanguageCode.hu,
  content:
    'A magyar nyelv az uráli nyelvcsaládba tartozik, és nem közeli rokona a környező országok többségében beszélt indoeurópai nyelveknek. Sajátos hangrendszere, ragjai és szórendje miatt sok tanuló különlegesnek találja.',
};
