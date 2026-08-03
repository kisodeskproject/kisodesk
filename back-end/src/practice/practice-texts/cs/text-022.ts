// texto-022.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text022: PracticeText = {
  id: 'cs-text-022',
  language: LanguageCode.cs,
  content:
    'Dlouhé samohlásky se zapisují čárkou: á, é, í, ó, ú a ý. U písmene u se na začátku některých domácích slov píše ú, zatímco uvnitř slova často stojí ů.',
};
