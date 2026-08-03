// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'no-text-002',
  language: LanguageCode.no,
  content:
    'Oslo er hovedstaden og den største byen i Norge. Byen ligger innerst i Oslofjorden og kombinerer moderne arkitektur med skog, parker og sjø.',
};
