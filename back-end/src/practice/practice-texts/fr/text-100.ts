// text-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'fr-text-100',
  language: LanguageCode.fr,
  content:
    'Le manga occupe une place visible dans la culture populaire française. Les traductions, les librairies spécialisées, les clubs de lecture et des événements comme Japan Expo réunissent des publics de tous âges.',
};
