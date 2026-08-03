// text-045.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text045: PracticeText = {
  id: 'fr-text-045',
  language: LanguageCode.fr,
  content:
    'Un train part à 7 h 42 et arrive à 10 h 18. Le trajet dure 2 h 36. Avec un retard de 14 minutes, l\'heure réelle d\'arrivée devient 10 h 32.',
};
