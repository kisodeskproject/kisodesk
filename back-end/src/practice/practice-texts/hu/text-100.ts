// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'hu-text-100',
  language: LanguageCode.hu,
  content:
    'A magyar film nemzetközileg is számos sikert ért el. Rendezők, operatőrök, színészek és animációs alkotók fesztiváldíjakat, Oscar-díjakat és más rangos elismeréseket szereztek.',
};
