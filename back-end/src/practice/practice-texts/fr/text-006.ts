// text-006.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text006: PracticeText = {
  id: 'fr-text-006',
  language: LanguageCode.fr,
  content:
    'Les vingt arrondissements de Paris sont numérotés selon une forme de spirale. Le parcours commence près du centre historique et tourne dans le sens des aiguilles d\'une montre, comme une coquille d\'escargot.',
};
