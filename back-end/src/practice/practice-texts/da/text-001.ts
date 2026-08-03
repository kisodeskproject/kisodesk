import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'da-text-001',
  language: LanguageCode.da,
  content:
    'Danmark ligger i Nordeuropa og består af halvøen Jylland samt hundredvis af øer. Landet har kyster mod både Nordsøen og Østersøen.',
};
