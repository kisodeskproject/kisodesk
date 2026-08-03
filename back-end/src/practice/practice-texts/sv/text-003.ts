// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'sv-text-003',
  language: LanguageCode.sv,
  content:
    'Stockholm är Sveriges huvudstad och är byggd på flera öar. Vatten, broar, parker och historiska kvarter präglar stadens utseende.',
};
