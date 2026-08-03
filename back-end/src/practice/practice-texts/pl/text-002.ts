// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'pl-text-002',
  language: LanguageCode.pl,
  content:
    'Warszawa jest stolicą i największym miastem Polski. Przez miasto przepływa Wisła, a jego zabudowa łączy rekonstrukcje historyczne z nowoczesną architekturą.',
};
