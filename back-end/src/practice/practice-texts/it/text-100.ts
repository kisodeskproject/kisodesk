// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'it-text-100',
  language: LanguageCode.it,
  content:
    'La commedia all\'italiana ha raccontato con ironia i cambiamenti sociali del dopoguerra. Attori e registi hanno unito umorismo, satira e osservazione della vita quotidiana.',
};
