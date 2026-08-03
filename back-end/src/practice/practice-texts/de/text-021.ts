// texto-021.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text021: PracticeText = {
  id: 'de-text-021',
  language: LanguageCode.de,
  content:
    'Alle deutschen Substantive werden großgeschrieben. Das gilt für konkrete Dinge wie Tisch und Haus ebenso wie für abstrakte Begriffe wie Freiheit, Hoffnung und Geduld.',
};
