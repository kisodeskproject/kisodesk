import cookie from '@fastify/cookie';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/global-http-exception.filter';
import { RequestIdInterceptor } from '../../src/common/interceptors/request-id.interceptor';
import { AppTestModule } from './app.test.module';

const PREFIX = 'e2e-ranking-';
let sequence = 0;
const RUN_SUBNET = (Date.now() % 200) + 1;
const nextAddress = () => `10.2.${RUN_SUBNET}.${10 + ++sequence}`;

type Client = { id: string; cookie: string; remoteAddress: string };
const errors = {
  totalKeystrokes: 1,
  totalErrors: 0,
  keys: [{ expected: 'a', totalPresses: 1, totalErrors: 0 }],
};

describe('Ranking (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const createUser = async (alias: string): Promise<Client> => {
    const suffix = `${Date.now()}-${sequence++}`;
    const remoteAddress = nextAddress();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      remoteAddress,
      payload: {
        email: `${PREFIX}${suffix}@example.test`,
        password: 'RankingE2E123',
        username: `${PREFIX}${alias}-${sequence}`,
        termsAccepted: true,
        privacyAccepted: true,
      },
    });
    expect(response.statusCode).toBe(200);
    const cookies = response.cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
    return { id: response.json().user.id, cookie: cookies, remoteAddress };
  };

  const practice = async (
    client: Client,
    language: 'es' | 'en' | 'pt',
    netWpm: number,
    grossWpm = netWpm + 5,
    accuracy = 95,
    locale = language === 'es' ? 'es-latam' : language === 'en' ? 'en-US' : 'pt-BR',
  ) => {
    const response = await app.inject({
      method: 'POST', url: '/v1/practice/results', headers: { cookie: client.cookie }, remoteAddress: client.remoteAddress,
      payload: {
        language, locale, netWpm, grossWpm, accuracy, timeElapsed: 60,
        errorSummary: errors,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  };

  const ranking = async (language = 'global', query = '') => {
    const response = await app.inject({ method: 'GET', url: `/v1/ranking?language=${language}${query}`, remoteAddress: nextAddress() });
    return response;
  };

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toContain('typing_test');
    const module = await Test.createTestingModule({ imports: [AppTestModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new RequestIdInterceptor());
    await app.register(cookie as any);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('v1', { exclude: [{ path: 'health', method: RequestMethod.ALL }] });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    const database = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`;
    expect(database[0].current_database).toBe('typing_test');
  });

  afterAll(async () => {
    await prisma.lesson.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.course.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.practiceSession.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.userRankingCache.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await app.close();
  });

  it('inicia, responde públicamente y no expone campos privados', async () => {
    const response = await ranking();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.objectContaining({ ranking: expect.any(Array), total: expect.any(Number) }));
    for (const row of response.json().ranking) {
      expect(row).not.toHaveProperty('email');
      expect(row).not.toHaveProperty('passwordHash');
    }
  });

  it('participa desde la primera práctica y mantiene ámbitos regionales y global', async () => {
    const user = await createUser('scopes');
    for (const scope of ['es-latam', 'en-US', 'global']) {
      expect((await ranking(scope)).json().ranking.some((row: any) => row.id === user.id)).toBe(false);
    }
    const emptyStats = await app.inject({ method: 'GET', url: '/v1/ranking/user-stats?language=global', headers: { cookie: user.cookie }, remoteAddress: user.remoteAddress });
    expect(emptyStats.json()).toEqual(expect.objectContaining({ rank: 0, bestWpmNet: 0, insufficientData: true }));
    await practice(user, 'es', 240);
    expect((await ranking('es-latam')).json().ranking.some((row: any) => row.id === user.id)).toBe(true);
    expect((await ranking('global')).json().ranking.some((row: any) => row.id === user.id)).toBe(true);
    await practice(user, 'en', 245);
    expect((await ranking('en-US')).json().ranking.some((row: any) => row.id === user.id)).toBe(true);
    expect(await prisma.userRankingCache.findUnique({ where: { userId_languageCode: { userId: user.id, languageCode: 'global' } } })).not.toBeNull();
    expect(await prisma.userRankingCache.count({ where: { userId: user.id, languageCode: 'global' } })).toBe(1);
    expect((await prisma.userRankingCache.findUniqueOrThrow({ where: { userId_languageCode: { userId: user.id, languageCode: 'es-latam' } } })).totalSessionsUsed).toBe(1);
    for (const scope of ['es-latam', 'en-US', 'global']) {
      const list = (await ranking(scope, '&limit=100')).json().ranking;
      const stats = await app.inject({ method: 'GET', url: `/v1/ranking/user-stats?language=${scope}`, headers: { cookie: user.cookie }, remoteAddress: user.remoteAddress });
      const row = list.findIndex((item: any) => item.id === user.id);
      expect(stats.json()).toEqual(expect.objectContaining({ rank: row + 1, score: scope === 'es-latam' ? 24000 : 24500 }));
    }
  });

  it('separa español, inglés y portugués por sus variantes regionales', async () => {
    const user = await createUser('regional-scopes');
    const scopes = [
      ['es', 'es-latam', 81],
      ['es', 'es-ES', 82],
      ['en', 'en-US', 83],
      ['en', 'en-GB', 84],
      ['pt', 'pt-BR', 85],
      ['pt', 'pt-PT', 86],
    ] as const;

    for (const [language, locale, netWpm] of scopes) {
      await practice(user, language, netWpm, netWpm + 5, 95, locale);
    }

    for (const [, locale, netWpm] of scopes) {
      const stats = await app.inject({
        method: 'GET',
        url: `/v1/ranking/user-stats?language=${locale}`,
        headers: { cookie: user.cookie },
        remoteAddress: user.remoteAddress,
      });
      expect(stats.json()).toEqual(expect.objectContaining({ bestWpmNet: netWpm, score: netWpm * 100 }));
      expect((await ranking(locale)).json().ranking.some((row: any) => row.id === user.id)).toBe(true);
    }
  });

  it('oculta usuarios privados y protege estadísticas personales', async () => {
    const user = await createUser('private');
    await practice(user, 'es', 88);
    await prisma.user.update({ where: { id: user.id }, data: { showInRanking: false } });
    expect((await ranking('es-latam')).json().ranking.some((row: any) => row.id === user.id)).toBe(false);
    const anonymous = await app.inject({ method: 'GET', url: '/v1/ranking/user-stats?language=es-latam' });
    expect(anonymous.statusCode).toBe(401);
    const personal = await app.inject({ method: 'GET', url: '/v1/ranking/user-stats?language=es-latam', headers: { cookie: user.cookie } });
    expect(personal.statusCode).toBe(200);
    expect(personal.json()).toEqual(expect.objectContaining({ bestWpmNet: 88, rankingVisible: false }));
  });

  it('usa solo las últimas diez y métricas de la misma sesión ganadora', async () => {
    const user = await createUser('window');
    await practice(user, 'es', 99, 101, 91);
    for (let i = 0; i < 10; i++) await practice(user, 'es', 40 + i, 70 + i, 80 + i);
    const stats = await app.inject({ method: 'GET', url: '/v1/ranking/user-stats?language=es-latam', headers: { cookie: user.cookie } });
    expect(stats.statusCode).toBe(200);
    expect(stats.json()).toEqual(expect.objectContaining({ bestWpmNet: 49, score: 4900, bestGrossWpm: 79, bestAccuracy: 89 }));
    const cache = await prisma.userRankingCache.findUniqueOrThrow({ where: { userId_languageCode: { userId: user.id, languageCode: 'es-latam' } } });
    const session = await prisma.practiceSession.findUniqueOrThrow({ where: { id: cache.bestSessionId } });
    expect([session.netWpm, session.grossWpm, session.accuracy]).toEqual([cache.bestWpmNet, cache.bestGrossWpm, cache.bestAccuracy]);
    expect(cache.totalSessionsUsed).toBe(10);
  });

  it('valida paginación estricta y conserva orden sin duplicados', async () => {
    const users = await Promise.all(['page-a', 'page-b', 'page-c'].map(createUser));
    await Promise.all(users.map((user, index) => practice(user, 'en', 70 + index)));
    const one = await ranking('en-US', '&limit=1&offset=0');
    const two = await ranking('en-US', '&limit=1&offset=1');
    expect(one.statusCode).toBe(200); expect(two.statusCode).toBe(200);
    expect(one.json().ranking[0].id).not.toBe(two.json().ranking[0].id);
    for (const invalid of ['abc', '10abc', '1.5', '0', '-1', '101']) {
      expect((await app.inject({ method: 'GET', url: `/v1/ranking?limit=${invalid}`, remoteAddress: nextAddress() })).statusCode).toBe(400);
    }
    for (const invalid of ['abc', '1.5', '-1']) {
      expect((await app.inject({ method: 'GET', url: `/v1/ranking?offset=${invalid}`, remoteAddress: nextAddress() })).statusCode).toBe(400);
    }
  });

  it('persiste prácticas concurrentes y deja cachés global e idioma consistentes', async () => {
    const user = await createUser('concurrent');
    await Promise.all([practice(user, 'es', 120), practice(user, 'es', 130)]);
    expect(await prisma.practiceSession.count({ where: { userId: user.id } })).toBe(2);
    const [language, global] = await Promise.all([
      prisma.userRankingCache.findUniqueOrThrow({ where: { userId_languageCode: { userId: user.id, languageCode: 'es-latam' } } }),
      prisma.userRankingCache.findUniqueOrThrow({ where: { userId_languageCode: { userId: user.id, languageCode: 'global' } } }),
    ]);
    expect(language).toEqual(expect.objectContaining({ bestWpmNet: 130, totalSessionsUsed: 2 }));
    expect(global).toEqual(expect.objectContaining({ bestWpmNet: 130, totalSessionsUsed: 2 }));
  });

  it('ordena empates por fecha y después por ID de forma estable', async () => {
    const [earlier, later, sameA, sameB] = await Promise.all(['tie-earlier', 'tie-later', 'tie-a', 'tie-b'].map(createUser));
    await Promise.all([practice(earlier, 'es', 250), practice(later, 'es', 250), practice(sameA, 'es', 249), practice(sameB, 'es', 249)]);
    const old = new Date('2024-01-01T00:00:00.000Z');
    const newer = new Date('2024-01-02T00:00:00.000Z');
    const equal = new Date('2024-01-03T00:00:00.000Z');
    for (const [user, date] of [[earlier, old], [later, newer], [sameA, equal], [sameB, equal]] as const) {
      const session = await prisma.practiceSession.findFirstOrThrow({ where: { userId: user.id } });
      await prisma.practiceSession.update({ where: { id: session.id }, data: { createdAt: date } });
      await prisma.userRankingCache.updateMany({ where: { userId: user.id }, data: { bestAchievedAt: date } });
    }
    const read = async () => (await ranking('es-latam', '&limit=100')).json().ranking;
    const first = await read(); const second = await read();
    const ids = first.map((row: any) => row.id);
    expect(ids.indexOf(earlier.id)).toBeLessThan(ids.indexOf(later.id));
    const expectedSame = [sameA.id, sameB.id].sort();
    expect(ids.filter((id: string) => expectedSame.includes(id))).toEqual(expectedSame);
    expect(second.map((row: any) => row.id)).toEqual(ids);
  });

  it('excluye al usuario sin alias sin exponer datos privados', async () => {
    const user = await createUser('no-alias');
    await practice(user, 'en', 247);
    await prisma.user.update({ where: { id: user.id }, data: { publicAlias: null } });
    const response = await ranking('en-US', '&limit=100');
    const row = response.json().ranking.find((item: any) => item.id === user.id);
    expect(row).toBeUndefined();
    for (const item of response.json().ranking) {
      expect(item).not.toHaveProperty('email');
      expect(item).not.toHaveProperty('passwordHash');
    }
  });

  it('completar una lección no crea prácticas ni modifica el ranking', async () => {
    const user = await createUser('lesson');
    const suffix = `${Date.now()}-${sequence++}`;
    const course = await prisma.course.create({ data: { name: 'E2E', slug: `${PREFIX}course-${suffix}`, languageCode: 'es' } });
    const lesson = await prisma.lesson.create({ data: { title: 'E2E', slug: `${PREFIX}lesson-${suffix}`, content: 'a', type: 'practice', courseLessons: { create: { courseId: course.id, order: 1 } } } });
    const before = await prisma.userRankingCache.count({ where: { userId: user.id } });
    const response = await app.inject({ method: 'POST', url: `/v1/lessons/${lesson.id}/complete`, headers: { cookie: user.cookie }, remoteAddress: user.remoteAddress, payload: { netWpm: 200, grossWpm: 210, accuracy: 100, timeElapsed: 60, errorSummary: errors } });
    expect(response.statusCode).toBe(201);
    expect(await prisma.lessonAttempt.count({ where: { userId: user.id, lessonId: lesson.id } })).toBe(1);
    expect(await prisma.practiceSession.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.userRankingCache.count({ where: { userId: user.id } })).toBe(before);
  });
});
