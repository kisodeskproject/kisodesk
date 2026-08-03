import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'pt-text-001',
  language: LanguageCode.pt,
  content:
    'Portugal continental ocupa a faixa ocidental da Península Ibérica e é acompanhado por dois arquipélagos atlânticos: os Açores e a Madeira. Apesar da dimensão relativamente pequena, o território reúne serras, planícies, vales, praias e ilhas vulcânicas.',
};
