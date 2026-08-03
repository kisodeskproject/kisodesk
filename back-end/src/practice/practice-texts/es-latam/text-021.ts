import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text021: PracticeText = {
  id: 'es-text-021',
  language: LanguageCode.es,
  content:
    'Las palabras agudas llevan tilde cuando terminan en vocal, en n o en s. Por ejemplo: canción, café y compás. Si terminan en otra consonante, normalmente se escriben sin tilde, como reloj o ciudad.',
};
