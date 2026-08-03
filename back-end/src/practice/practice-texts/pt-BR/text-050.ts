// texto-050.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text050: PracticeText = {
  id: 'pt-text-050',
  language: LanguageCode.pt,
  content:
    'Uma loja ofereceu 15% de desconto em uma mochila de R$ 120,00. O abatimento foi de R$ 18,00, portanto o preço final ficou em R$ 102,00.',
};
