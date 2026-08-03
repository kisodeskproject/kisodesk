// texto-035.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text035: PracticeText = {
  id: 'tr-text-035',
  language: LanguageCode.tr,
  content:
    'Tarih yazarken gün, ay ve yıl arasına nokta ya da eğik çizgi konabilir. 29.10.1923 ve 29/10/1923 örnekleri kullanılabilir.',
};
