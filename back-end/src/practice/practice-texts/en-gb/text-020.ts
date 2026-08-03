// texto-020.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text020: PracticeText = {
  id: 'en-text-020',
  language: LanguageCode.en,
  content:
    'The postcode system in the United Kingdom can identify very small groups of addresses. Letters and numbers indicate postal areas, districts and delivery routes, helping mail reach homes and businesses efficiently.',
};
