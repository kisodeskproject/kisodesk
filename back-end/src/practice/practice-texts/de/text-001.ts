import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'de-text-001',
  language: LanguageCode.de,
  content:
    'Deutschland liegt im Herzen Europas und grenzt an neun Staaten. Kein anderes Land der Europäischen Union hat mehr direkte Nachbarländer.',
};
