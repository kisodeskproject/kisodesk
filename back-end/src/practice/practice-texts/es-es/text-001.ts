import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'es-text-001',
  language: LanguageCode.es,
  content:
    'España presenta una gran variedad de paisajes en un territorio relativamente compacto. En pocas horas se puede pasar de una costa mediterránea a una meseta elevada, atravesar una sierra nevada o llegar a una zona de clima atlántico con abundantes lluvias.',
};
