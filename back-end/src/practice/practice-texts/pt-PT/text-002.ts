// texto-002.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text002: PracticeText = {
  id: 'pt-text-002',
  language: LanguageCode.pt,
  content:
    'As fronteiras terrestres de Portugal estão entre as mais antigas da Europa. A configuração do território continental ficou praticamente definida no século XIII, depois da conquista do Algarve durante o reinado de D. Afonso III.',
};
