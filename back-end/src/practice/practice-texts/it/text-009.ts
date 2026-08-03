// texto-009.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text009: PracticeText = {
  id: 'it-text-009',
  language: LanguageCode.it,
  content:
    'La pizza napoletana è caratterizzata da un impasto morbido, un bordo alto e una cottura molto rapida. Le varianti più note sono la marinara e la margherita.',
};
