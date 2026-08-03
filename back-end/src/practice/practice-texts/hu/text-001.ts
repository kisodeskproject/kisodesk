import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'hu-text-001',
  language: LanguageCode.hu,
  content:
    'Magyarország Közép-Európában fekszik, és nincs közvetlen tengeri kijárata. Területét síkságok, dombvidékek, középhegységek, folyók és tavak teszik változatossá, miközben az ország legnagyobb része a Kárpát-medencéhez tartozik.',
};
