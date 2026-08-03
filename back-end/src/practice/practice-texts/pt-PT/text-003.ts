// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'pt-text-003',
  language: LanguageCode.pt,
  content:
    'A língua portuguesa nasceu no noroeste da Península Ibérica e espalhou-se por vários continentes. Hoje é falada na Europa, em África, na América do Sul e na Ásia, com pronúncias, ritmos e vocabulários próprios de cada região.',
};
