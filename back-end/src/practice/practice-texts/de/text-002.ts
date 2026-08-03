// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'de-text-002',
  language: LanguageCode.de,
  content:
    'Die Bundesrepublik Deutschland besteht aus sechzehn Bundesländern. Drei davon, Berlin, Hamburg und Bremen, sind zugleich Städte und eigenständige Länder.',
};
