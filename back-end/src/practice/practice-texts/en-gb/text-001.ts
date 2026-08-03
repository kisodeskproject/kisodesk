import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'en-text-001',
  language: LanguageCode.en,
  content:
    'The United Kingdom is made up of England, Scotland, Wales and Northern Ireland. Each nation has its own traditions, landscapes and cultural identity, while sharing institutions such as the monarchy and the Parliament of the United Kingdom.',
};
