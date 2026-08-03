// texto-040.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text040: PracticeText = {
  id: 'tr-text-040',
  language: LanguageCode.tr,
  content:
    'Gün, ay ve dil adları özel bir adın parçası değilse küçük harfle başlar. pazartesi, ocak, Türkçe ve İngilizce biçimleri kullanılır.',
};
