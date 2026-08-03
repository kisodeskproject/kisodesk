// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'it-text-003',
  language: LanguageCode.it,
  content:
    'L\'Italia confina con Francia, Svizzera, Austria e Slovenia. All\'interno del territorio italiano si trovano anche due piccoli Stati indipendenti: San Marino e la Città del Vaticano.',
};
