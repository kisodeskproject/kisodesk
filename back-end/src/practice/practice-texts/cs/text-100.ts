// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'cs-text-100',
  language: LanguageCode.cs,
  content:
    'Mezinárodní filmový festival Karlovy Vary patří k nejvýznamnějším kulturním událostem v Česku. Uvádí nové filmy, hostí tvůrce a uděluje festivalové ceny.',
};
