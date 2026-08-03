import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'no-text-001',
  language: LanguageCode.no,
  content:
    'Norge ligger i Nord-Europa og har en lang kyst mot Atlanterhavet og Barentshavet. Landet er kjent for fjorder, fjell, øyer og dype daler.',
};
