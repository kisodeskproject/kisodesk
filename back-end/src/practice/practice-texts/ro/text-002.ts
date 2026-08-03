// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'ro-text-002',
  language: LanguageCode.ro,
  content:
    'București este capitala și cel mai mare oraș al României. Orașul combină clădiri istorice, bulevarde largi, parcuri și cartiere moderne.',
};
