import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'hr-text-001',
  language: LanguageCode.hr,
  content:
    'Hrvatska se nalazi na dodiru srednje Europe, jugoistočne Europe i Sredozemlja. Njezin prostor obuhvaća nizine, planine, krške visoravni, rijeke, jezera i razvedenu jadransku obalu.',
};
