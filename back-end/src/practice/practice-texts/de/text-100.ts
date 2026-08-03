// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'de-text-100',
  language: LanguageCode.de,
  content:
    'Die Leipziger Buchmesse und die Frankfurter Buchmesse bringen Verlage, Autorinnen, Autoren und Leser zusammen. Lesungen, Gespräche und Neuerscheinungen stehen dabei im Mittelpunkt.',
};
