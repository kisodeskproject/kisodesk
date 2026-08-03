// texto-030.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text030: PracticeText = {
  id: 'pt-text-030',
  language: LanguageCode.pt,
  content:
    'Em Portugal, a vírgula separa normalmente a parte inteira da parte decimal. Um preço pode ser escrito como 12,50 euros, enquanto os algarismos de números longos podem ser agrupados em espaços para facilitar a leitura.',
};
