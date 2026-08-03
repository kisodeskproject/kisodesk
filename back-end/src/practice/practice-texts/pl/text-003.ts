// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'pl-text-003',
  language: LanguageCode.pl,
  content:
    'Wisła jest najdłuższą rzeką w Polsce. Jej źródła znajdują się w Beskidzie Śląskim, a ujście prowadzi do Zatoki Gdańskiej.',
};
