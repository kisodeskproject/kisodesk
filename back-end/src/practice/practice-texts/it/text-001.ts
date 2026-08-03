import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'it-text-001',
  language: LanguageCode.it,
  content:
    'L\'Italia si estende nel Mar Mediterraneo con una forma che ricorda uno stivale. Il territorio comprende la penisola, numerose isole e due grandi isole principali: Sicilia e Sardegna.',
};
