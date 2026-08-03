// text-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'fr-text-003',
  language: LanguageCode.fr,
  content:
    'Le Louvre a connu plusieurs vies avant de devenir un musée. Il fut d\'abord une forteresse médiévale, puis une résidence royale. Des vestiges de ses anciennes murailles sont encore visibles sous le bâtiment actuel.',
};
