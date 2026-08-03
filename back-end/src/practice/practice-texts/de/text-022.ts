// texto-022.ts
import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text022: PracticeText = {
  id: 'de-text-022',
  language: LanguageCode.de,
  content:
    'Die Umlaute Ä, Ö und Ü sind eigenständige Buchstaben der deutschen Rechtschreibung. Wenn sie technisch nicht dargestellt werden können, schreibt man ersatzweise ae, oe und ue.',
};
