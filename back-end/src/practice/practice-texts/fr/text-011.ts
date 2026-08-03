// text-011.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text011: PracticeText = {
  id: 'fr-text-011',
  language: LanguageCode.fr,
  content:
    'Le système métrique a été élaboré en France pendant la Révolution. Il cherchait à remplacer une multitude d\'unités locales par des mesures communes, fondées sur des références plus simples et utilisables partout.',
};
