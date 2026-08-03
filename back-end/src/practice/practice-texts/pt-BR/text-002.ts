// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'pt-text-002',
  language: LanguageCode.pt,
  content:
    'O território brasileiro é atravessado pela Linha do Equador e pelo Trópico de Capricórnio. Por isso, o país apresenta áreas equatoriais, tropicais e subtropicais, com diferenças marcantes de temperatura, chuvas e duração das estações.',
};
