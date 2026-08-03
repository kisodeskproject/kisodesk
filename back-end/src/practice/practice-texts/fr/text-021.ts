// text-021.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text021: PracticeText = {
  id: 'fr-text-021',
  language: LanguageCode.fr,
  content:
    'Les accents modifient souvent la prononciation ou permettent de distinguer des mots. É, è, ê et ë ne sont donc pas interchangeables : élève, forêt et Noël montrent trois fonctions différentes des signes placés sur la lettre e.',
};
