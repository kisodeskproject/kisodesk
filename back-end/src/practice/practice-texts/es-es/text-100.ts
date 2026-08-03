import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'es-text-100',
  language: LanguageCode.es,
  content:
    'Las plataformas digitales han ampliado la difusión internacional de series, películas, música y creadores españoles. Al mismo tiempo, los contenidos regionales mantienen acentos, paisajes y referencias que reflejan la diversidad del país.',
};
