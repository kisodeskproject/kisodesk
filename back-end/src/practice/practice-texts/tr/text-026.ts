// texto-026.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text026: PracticeText = {
  id: 'tr-text-026',
  language: LanguageCode.tr,
  content:
    'Bağlaç olan de ve da ayrı yazılır. Evde kaldı cümlesindeki -de ek, ben de geldim cümlesindeki de ise bağlaçtır.',
};
