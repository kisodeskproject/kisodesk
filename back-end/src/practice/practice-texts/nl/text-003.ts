// texto-003.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text003: PracticeText = {
  id: 'nl-text-003',
  language: LanguageCode.nl,
  content:
    'Amsterdam is de hoofdstad van Nederland, maar de regering en het parlement zijn gevestigd in Den Haag. Deze verdeling bestaat al lange tijd.',
};
