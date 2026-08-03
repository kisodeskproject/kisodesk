// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'nl-text-002',
  language: LanguageCode.nl,
  content:
    'Een aanzienlijk deel van Nederland ligt onder zeeniveau. Dijken, duinen, gemalen en stormvloedkeringen beschermen steden, dorpen en landbouwgrond tegen overstromingen.',
};
