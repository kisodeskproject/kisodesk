// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'da-text-100',
  language: LanguageCode.da,
  content:
    'Matador er en klassisk dansk tv-serie om livet i den fiktive by Korsbæk. Serien følger familier og samfundsforandringer fra 1929 til 1947.',
};
