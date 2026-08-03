// texto-011.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text011: PracticeText = {
  id: 'en-text-011',
  language: LanguageCode.en,
  content:
    'The London Underground opened in 1863 and became the world\'s first underground passenger railway. Its familiar map simplifies a complex network by emphasising connections rather than exact geographical distances.',
};
