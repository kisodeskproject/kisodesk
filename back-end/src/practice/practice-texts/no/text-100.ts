// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'no-text-100',
  language: LanguageCode.no,
  content:
    'Eurovision Song Contest har flere norske vinnere, blant annet Bobbysocks og Alexander Rybak. Konkurransen har et stort norsk publikum.',
};
