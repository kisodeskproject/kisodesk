// texto-100.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text100: PracticeText = {
  id: 'hr-text-100',
  language: LanguageCode.hr,
  content:
    'Animirani film Profesor Baltazar postao je prepoznatljiv dio hrvatske popularne kulture. Serija prikazuje dobroćudnog izumitelja koji neobične probleme rješava maštom i znanjem.',
};
