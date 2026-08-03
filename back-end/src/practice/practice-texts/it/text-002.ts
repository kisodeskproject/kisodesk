// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'it-text-002',
  language: LanguageCode.it,
  content:
    'Roma è la capitale d\'Italia ed è conosciuta come la Città Eterna. Nel suo territorio si trovano monumenti antichi, chiese, piazze, fontane e quartieri costruiti in epoche molto diverse.',
};
