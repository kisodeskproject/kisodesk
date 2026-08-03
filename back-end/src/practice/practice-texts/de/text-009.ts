// texto-009.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text009: PracticeText = {
  id: 'de-text-009',
  language: LanguageCode.de,
  content:
    'Der Kölner Dom wurde über mehrere Jahrhunderte hinweg errichtet. Seine beiden Türme prägen die Silhouette der Stadt und sind schon aus großer Entfernung zu erkennen.',
};
