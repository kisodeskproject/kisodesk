import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'en-text-001',
  language: LanguageCode.en,
  content:
    'The United States spans six time zones across its fifty states. Because of this enormous east-to-west distance, sunrise can reach Maine several hours before it appears in Hawaii. Travelers often adjust their watches more than once during a long domestic trip.',
};
