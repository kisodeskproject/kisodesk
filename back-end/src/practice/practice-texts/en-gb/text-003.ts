// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'en-text-003',
  language: LanguageCode.en,
  content:
    'London stands on the River Thames and has grown around it for nearly two thousand years. Bridges, docks and riverside neighbourhoods reveal how the waterway shaped trade, transport and daily life in the capital.',
};
