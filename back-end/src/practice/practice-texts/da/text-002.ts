// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'da-text-002',
  language: LanguageCode.da,
  content:
    'København er Danmarks hovedstad og største by. Byen ligger hovedsageligt på øerne Sjælland og Amager og er kendt for havneområder, cykelstier og historiske kvarterer.',
};
