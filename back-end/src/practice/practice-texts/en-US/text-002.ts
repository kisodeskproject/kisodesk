// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'en-text-002',
  language: LanguageCode.en,
  content:
    'Alaska is the largest U.S. state by area, while Rhode Island is the smallest. Alaska is so large that it contains vast mountain ranges, glaciers, forests, and tundra. Its communities are often separated by long distances and challenging terrain.',
};
