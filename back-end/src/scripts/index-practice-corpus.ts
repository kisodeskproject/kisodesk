import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const texts = await prisma.practiceText.findMany({ select: { id: true, content: true } });
  for (const { id, content } of texts) {
    const normalized = content.normalize('NFC').toLocaleLowerCase();
    const chars = Array.from(new Set(Array.from(normalized)));
    await prisma.practiceText.update({ where: { id }, data: {
      characterSet: chars,
      wordIndex: Array.from(new Set(normalized.match(/[\p{L}\p{M}]+/gu) ?? [])),
      bigramIndex: Array.from(new Set(Array.from(normalized).slice(1).map((char, index) => `${normalized[index]}${char}`))),
      accentIndex: chars.filter((char) => /[\u0300-\u036fáéíóúüàèìòùâêîôû]/iu.test(char)),
    }});
  }
}

main().finally(() => prisma.$disconnect());
