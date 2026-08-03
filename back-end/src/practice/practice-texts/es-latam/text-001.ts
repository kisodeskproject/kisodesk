import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'es-text-001',
  language: LanguageCode.es,
  content:
    'América Latina reúne países con una gran diversidad de climas, paisajes y formas de hablar. En una misma región conviven selvas tropicales, desiertos, cordilleras, llanuras, islas y ciudades ubicadas a gran altura sobre el nivel del mar.',
};
