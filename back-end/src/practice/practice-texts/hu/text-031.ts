// texto-031.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text031: PracticeText = {
  id: 'hu-text-031',
  language: LanguageCode.hu,
  content:
    'A magyar keltezésben az év, a hónap és a nap ebben a sorrendben követi egymást. Szövegben így írjuk: 2026. július 22., a mondat pedig a dátum után folytatódhat.',
};
