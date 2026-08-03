import { LanguageCode } from '@prisma/client';

import type { PracticeText } from '../types';

export const text001: PracticeText = {
  id: 'cs-text-001',
  language: LanguageCode.cs,
  content:
    'Česko leží ve střední Evropě a nemá přístup k moři. Jeho krajinu tvoří pohoří, pahorkatiny, nížiny, řeky, rybníky i rozsáhlé lesy.',
};
