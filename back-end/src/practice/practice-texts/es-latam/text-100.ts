import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'es-text-100',
  language: LanguageCode.es,
  content:
    'Las plataformas digitales permiten que canciones, series, películas y creadores latinoamericanos lleguen rápidamente a públicos globales. Al mismo tiempo, cada país conserva expresiones propias que enriquecen la cultura compartida.',
};
