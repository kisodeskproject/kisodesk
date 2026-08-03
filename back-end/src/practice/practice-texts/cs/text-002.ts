// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'cs-text-002',
  language: LanguageCode.cs,
  content:
    'Praha se rozkládá na obou březích Vltavy. Historické centrum spojuje středověké ulice, barokní paláce, gotické kostely a moderní městský život.',
};
