// texto-040.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text040: PracticeText = {
  id: 'de-text-040',
  language: LanguageCode.de,
  content:
    'Bei der Silbentrennung bleiben einzelne Buchstaben nicht allein stehen. Zusammengesetzte Wörter können oft an der Grenze ihrer Bestandteile getrennt werden, etwa Haus-tür oder Schul-buch.',
};
