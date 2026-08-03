// texto-004.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text004: PracticeText = {
  id: 'hu-text-004',
  language: LanguageCode.hu,
  content:
    'Magyarország híres termálvizeiről és gyógyfürdőiről. Budapest alatt különösen sok meleg vizű forrás található, ezért a fővárosban történelmi török fürdők és nagy, modern fürdőkomplexumok egyaránt működnek.',
};
