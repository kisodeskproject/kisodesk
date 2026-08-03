// texto-005.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text005: PracticeText = {
  id: 'en-text-005',
  language: LanguageCode.en,
  content:
    'The Giant\'s Causeway in Northern Ireland is formed from thousands of interlocking basalt columns. They were created by ancient volcanic activity, although local legends describe the stones as the remains of a road built by a giant.',
};
