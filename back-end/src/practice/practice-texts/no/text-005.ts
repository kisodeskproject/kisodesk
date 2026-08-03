// texto-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'no-text-005',
  language: LanguageCode.no,
  content:
    'Sognefjorden er den lengste og dypeste fjorden i Norge. Flere sidefjorder skjærer seg langt inn mellom høye fjell.',
};
