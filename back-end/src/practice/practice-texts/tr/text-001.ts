import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'tr-text-001',
  language: LanguageCode.tr,
  content:
    'Türkiye, Avrupa ile Asya arasında yer alır ve iki kıtayı birbirine bağlayan önemli bir konuma sahiptir. Ülkenin üç tarafı Karadeniz, Ege Denizi ve Akdeniz ile çevrilidir.',
};
