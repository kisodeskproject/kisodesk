import { randomBytes } from 'crypto';

function normalizeAliasSeed(seed: string): string {
  const normalized = seed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 20);

  if (normalized.length >= 3) return normalized;
  return `user_${randomBytes(3).toString('hex')}`;
}

export async function createUniquePublicAlias(prisma: any, seed: string): Promise<string> {
  const base = normalizeAliasSeed(seed);

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = attempt === 0 ? '' : `_${randomBytes(3).toString('hex')}`;
    const candidate = `${base}${suffix}`.slice(0, 30);
    const existing = await prisma.user.findUnique({
      where: { publicAlias: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  return `user_${randomBytes(10).toString('hex')}`.slice(0, 30);
}
