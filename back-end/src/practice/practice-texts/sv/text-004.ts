// texto-004.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text004: PracticeText = {
  id: 'sv-text-004',
  language: LanguageCode.sv,
  content:
    'Sverige har tjugoen län och tvåhundranittio kommuner. Län och kommuner ansvarar för olika delar av den offentliga verksamheten.',
};
