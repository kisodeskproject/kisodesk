// text-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'fr-text-002',
  language: LanguageCode.fr,
  content:
    'Le territoire français ne se limite pas à l\'Europe. Des régions et collectivités d\'outre-mer se trouvent dans l\'Atlantique, l\'océan Indien, le Pacifique et les Caraïbes, ce qui donne au pays une présence sur plusieurs continents.',
};
