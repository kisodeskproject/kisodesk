// texto-031.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text031: PracticeText = {
  id: 'it-text-031',
  language: LanguageCode.it,
  content:
    'L\'articolo un non vuole l\'apostrofo davanti a un nome maschile. Si scrive un amico, mentre davanti a un nome femminile si scrive un\'amica.',
};
