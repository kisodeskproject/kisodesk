// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'en-text-002',
  language: LanguageCode.en,
  content:
    'Great Britain is the large island containing England, Scotland and Wales. The term United Kingdom also includes Northern Ireland. These names are often confused, but they describe different geographical and political areas.',
};
