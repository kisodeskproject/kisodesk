// texto-021.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text021: PracticeText = {
  id: 'hu-text-021',
  language: LanguageCode.hu,
  content:
    'A magyar ábécé negyvennégy betűből áll. Az egyjegyű betűk mellett több kétjegyű és egy háromjegyű betű is szerepel benne, például cs, gy, ly, ny, sz, ty, zs, valamint dzs.',
};
