// text-042.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text042: PracticeText = {
  id: 'fr-text-042',
  language: LanguageCode.fr,
  content:
    'Un clavier comporte 26 lettres, 10 chiffres et plusieurs touches de fonction. Lors d\'un test de 5 minutes, une personne tape 1 250 caractères, soit une moyenne de 250 caractères par minute.',
};
