// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'nl-text-100',
  language: LanguageCode.nl,
  content:
    'Nederlandse televisieprogramma\'s en formats worden vaak internationaal verkocht. Spelshows, talentenjachten en realityprogramma\'s krijgen versies in vele landen.',
};
