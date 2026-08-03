import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text021: PracticeText = {
  id: 'es-text-021',
  language: LanguageCode.es,
  content:
    'Las palabras agudas llevan tilde cuando terminan en vocal, en n o en s. Canción, café y compás son ejemplos claros; reloj, pared y feliz no la llevan porque terminan en otras consonantes.',
};
