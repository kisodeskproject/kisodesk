import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'fr-text-001',
  language: LanguageCode.fr,
  content:
    'La France métropolitaine est souvent surnommée l\'Hexagone, car son contour général rappelle une figure à six côtés. Cette image est pratique, même si les frontières et les côtes du pays forment naturellement un dessin beaucoup plus irrégulier.',
};
