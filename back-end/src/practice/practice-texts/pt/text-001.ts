import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'pt-text-001',
  language: LanguageCode.pt,
  content:
    'O Brasil é dividido em cinco grandes regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul. Cada uma reúne paisagens, sotaques, hábitos e tradições próprias, o que ajuda a explicar a enorme diversidade cultural encontrada no país.',
};
