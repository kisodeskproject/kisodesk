// text-050.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text050: PracticeText = {
  id: 'fr-text-050',
  language: LanguageCode.fr,
  content:
    'Le thermomètre indique 6 °C au lever du jour, puis 17 °C dans l\'après-midi. La température augmente de 11 degrés avant de redescendre à 12 °C le soir.',
};
