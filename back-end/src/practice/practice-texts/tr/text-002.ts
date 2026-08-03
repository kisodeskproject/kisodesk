// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'tr-text-002',
  language: LanguageCode.tr,
  content:
    'Ankara Türkiye\'nin başkentidir, İstanbul ise ülkenin en kalabalık şehridir. İstanbul, Boğaz sayesinde Avrupa ve Asya yakalarına ayrılır.',
};
