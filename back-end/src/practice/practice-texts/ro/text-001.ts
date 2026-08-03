import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'ro-text-001',
  language: LanguageCode.ro,
  content:
    'România se află în sud-estul Europei și are ieșire la Marea Neagră. Relieful său cuprinde munți, dealuri, podișuri, câmpii și Delta Dunării.',
};
