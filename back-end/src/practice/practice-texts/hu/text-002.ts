// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'hu-text-002',
  language: LanguageCode.hu,
  content:
    'A Balaton Közép-Európa egyik legnagyobb tava, ezért gyakran magyar tengernek nevezik. Nyáron strandok, vitorlások és fesztiválok vonzzák a látogatókat, télen pedig a part menti települések csendesebb arcukat mutatják.',
};
