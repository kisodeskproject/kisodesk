// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'en-text-100',
  language: LanguageCode.en,
  content:
    'Podcasts expanded the tradition of American radio by allowing listeners to choose programs on demand. Popular formats include interviews, investigations, comedy, education, news, fiction, and personal storytelling. A microphone and editing software can turn a small project into a global show.',
};
