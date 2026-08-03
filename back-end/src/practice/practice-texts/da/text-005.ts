// texto-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'da-text-005',
  language: LanguageCode.da,
  content:
    'Danmark er et fladt land med få høje bakker. Det højeste naturlige punkt ligger i Østjylland og er kun lidt over 170 meter højt.',
};
