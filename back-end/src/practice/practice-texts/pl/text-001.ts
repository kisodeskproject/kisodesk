import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'pl-text-001',
  language: LanguageCode.pl,
  content:
    'Polska leży w Europie Środkowej i ma dostęp do Morza Bałtyckiego. Graniczy z siedmioma państwami, a jej krajobraz obejmuje wybrzeże, niziny, pojezierza, wyżyny i góry.',
};
