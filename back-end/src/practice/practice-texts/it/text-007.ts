// texto-007.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text007: PracticeText = {
  id: 'it-text-007',
  language: LanguageCode.it,
  content:
    'Venezia è costruita su numerose isole collegate da ponti. I canali sostituiscono molte strade e vengono percorsi da vaporetti, barche da lavoro e gondole.',
};
