// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'no-text-003',
  language: LanguageCode.no,
  content:
    'Norge grenser til Sverige, Finland og Russland. Den lange grensen mot Sverige går gjennom både skog, fjell og åpne vidder.',
};
