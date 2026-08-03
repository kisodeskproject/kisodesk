// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'pl-text-100',
  language: LanguageCode.pl,
  content:
    'Wielka Orkiestra Świątecznej Pomocy organizuje coroczną zbiórkę pieniędzy na sprzęt medyczny. Finałowi towarzyszą koncerty i wydarzenia w wielu miastach.',
};
