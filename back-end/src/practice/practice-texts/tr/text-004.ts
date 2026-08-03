// texto-004.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text004: PracticeText = {
  id: 'tr-text-004',
  language: LanguageCode.tr,
  content:
    'Türkiye seksen bir ilden oluşur. Her ilin kendine özgü yemekleri, ağız özellikleri, mimarisi ve yerel gelenekleri vardır.',
};
