import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'nl-text-001',
  language: LanguageCode.nl,
  content:
    'Nederland ligt in het noordwesten van Europa en grenst aan België, Duitsland en de Noordzee. Een groot deel van het land bestaat uit vlakke polders, rivieren en kustgebieden.',
};
