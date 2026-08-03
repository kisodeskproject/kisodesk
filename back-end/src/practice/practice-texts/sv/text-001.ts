import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'sv-text-001',
  language: LanguageCode.sv,
  content:
    'Sverige ligger i norra Europa och är det största landet i Norden till ytan. Landet har långa kuster mot Östersjön och Nordsjön samt tusentals sjöar och öar.',
};
