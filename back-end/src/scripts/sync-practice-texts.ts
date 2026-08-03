import { PrismaClient } from '@prisma/client';

import { freePracticeTextsByLanguage } from '../practice/practice-texts';

const prisma = new PrismaClient();

function buildIndexes(content: string) {
  const normalized = content.normalize('NFC').toLocaleLowerCase();
  const characters = Array.from(normalized);

  return {
    characterSet: Array.from(new Set(characters)),
    wordIndex: Array.from(new Set(normalized.match(/[\p{L}\p{M}]+/gu) ?? [])),
    bigramIndex: Array.from(
      new Set(characters.slice(1).map((character, index) => `${characters[index]}${character}`)),
    ),
    accentIndex: characters.filter((character) =>
      /[\u0300-\u036fáéíóúüàèìòùâêîôû]/iu.test(character),
    ),
  };
}

async function main() {
  const texts = Object.values(freePracticeTextsByLanguage).flat();

  for (const text of texts) {
    const data = {
      languageCode: text.language,
      content: text.content,
      ...buildIndexes(text.content),
    };

    await prisma.practiceText.upsert({
      where: { id: text.id },
      create: { id: text.id, ...data },
      update: data,
    });
  }

  console.log(`Corpus de práctica sincronizado: ${texts.length} textos.`);
}

main()
  .catch((error: unknown) => {
    console.error('No se pudo sincronizar el corpus de práctica:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
