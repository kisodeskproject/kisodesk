// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'sv-text-002',
  language: LanguageCode.sv,
  content:
    'Sverige gränsar till Norge och Finland. Öresundsbron förbinder dessutom södra Sverige med Danmark genom både bro och tunnel.',
};
