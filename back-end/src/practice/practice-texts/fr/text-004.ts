// text-004.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text004: PracticeText = {
  id: 'fr-text-004',
  language: LanguageCode.fr,
  content:
    'Le Mont-Saint-Michel est construit sur un îlot rocheux entouré de vastes étendues de sable. Selon les marées, l\'eau transforme rapidement le paysage et peut isoler temporairement le mont du continent.',
};
