// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'de-text-003',
  language: LanguageCode.de,
  content:
    'Berlin ist die Hauptstadt und zugleich die bevölkerungsreichste Stadt Deutschlands. Die Stadt ist für ihre Museen, Parks, historischen Bauwerke und vielfältigen Stadtviertel bekannt.',
};
