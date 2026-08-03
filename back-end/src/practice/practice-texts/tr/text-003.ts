// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'tr-text-003',
  language: LanguageCode.tr,
  content:
    'İstanbul Boğazı, Karadeniz ile Marmara Denizi\'ni birbirine bağlar. Üzerindeki köprüler ve deniz ulaşımı, şehrin iki yakası arasında günlük bağlantı sağlar.',
};
