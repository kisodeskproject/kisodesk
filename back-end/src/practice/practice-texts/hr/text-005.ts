// texto-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'hr-text-005',
  language: LanguageCode.hr,
  content:
    'Hrvatska ima osam nacionalnih parkova. Oni štite planinske krajolike, šume, jezera, rijeke, otoke i podmorje.',
};
