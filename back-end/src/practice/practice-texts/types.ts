import { LanguageCode } from '@prisma/client';

export type PracticeText = {
  id: string;
  language: LanguageCode;
  content: string;
};
