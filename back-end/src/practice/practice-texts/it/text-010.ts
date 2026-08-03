// texto-010.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text010: PracticeText = {
  id: 'it-text-010',
  language: LanguageCode.it,
  content:
    'La pasta italiana esiste in centinaia di formati. Spaghetti, penne, fusilli, orecchiette e tagliatelle vengono abbinati a condimenti diversi secondo la tradizione regionale.',
};
