// test/e2e/practice.e2e-spec.ts
// Prueba mínima contra la base temporal de integración.
// TODO: Desarrollar las siguientes pruebas:
//   - Registro de usuario y obtención de token de acceso.
//   - Guardado exitoso de una sesión de práctica con datos válidos.
//   - Rechazo de peticiones sin autenticación (401).
//   - Validación de campos obligatorios (keystrokes vacío) y rangos (netWpm, grossWpm, accuracy, timeElapsed).
//   - Comportamiento con cookies (access_token) en lugar de header Authorization cuando se solucione la compatibilidad de @fastify/cookie en tests.
// El código original se conserva como referencia.

/*
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppTestModule } from './app.test.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Practice (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.practiceSession.deleteMany({});
    await prisma.userRankingCache.deleteMany({});
    await prisma.$executeRaw`DELETE FROM "user_key_errors"`;
    await prisma.user.deleteMany({ where: { email: 'e2e-practice@test.com' } });
    await app.close();
  });

  let accessToken: string;

  it('debe registrar usuario y obtener token', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: 'e2e-practice@test.com', username: 'TestUserE2E', password: 'Str0ngPass!' })
      .expect(201);
    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('debe guardar una sesión de práctica válida', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/practice/results')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        netWpm: 80,
        grossWpm: 85,
        accuracy: 95,
        timeElapsed: 120,
        language: 'es',
        keystrokes: [{ key: 'a', timestamp: 100, correct: true, expected: 'a' }],
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
  });

  it('debe rechazar sin autenticación', async () => {
    await request(app.getHttpServer())
      .post('/v1/practice/results')
      .send({
        netWpm: 80,
        grossWpm: 85,
        accuracy: 95,
        timeElapsed: 120,
        language: 'es',
        keystrokes: [],
      })
      .expect(401);
  });

  // TODO: agregar pruebas de validación (keystrokes vacío, rangos inválidos)
  // TODO: volver a usar cookies cuando fastify-cookie funcione en tests
});
*/

import { PrismaClient } from '@prisma/client';
import { PracticeService } from '../../src/practice/practice.service';
import { TelemetryService } from '../../src/practice/telemetry.service';
import { ErrorTrackingService } from '../../src/errors/error-tracking.service';

describe('Practice telemetry schema (e2e)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => prisma.$disconnect());

  it('incluye telemetría y la restricción de idempotencia', async () => {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'practice_sessions'
        AND column_name IN ('telemetry', 'derived_metrics', 'client_session_id')
    `;
    expect(columns.map((column) => column.column_name).sort()).toEqual([
      'client_session_id', 'derived_metrics', 'telemetry',
    ]);

    const indexes = await prisma.$queryRaw<Array<{ indexdef: string }>>`
      SELECT indexdef FROM pg_indexes
      WHERE tablename = 'practice_sessions'
        AND indexdef LIKE '%client_session_id%'
    `;
    expect(indexes.some((index) => index.indexdef.includes('UNIQUE'))).toBe(true);
  });

  it('incluye contador de muestras de latencia en bigramas', async () => {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bigram_stats' AND column_name = 'latency_samples'
    `;
    expect(columns).toHaveLength(1);
  });
});

describe('PracticeService behavior (e2e)', () => {
  const prisma = new PrismaClient();
  const userId = 'e2e-adaptive-user';
  const service = new PracticeService(
    prisma as any,
    new ErrorTrackingService(prisma as any),
    { recordPracticeTimeInTransaction: jest.fn() } as any,
    new TelemetryService(),
    { labels: () => ({ inc: jest.fn() }) } as any,
  );
  const telemetry = (id: string) => ({
    clientSessionId: id, netWpm: 0, grossWpm: 0, accuracy: 0, timeElapsed: 1,
    language: 'es' as const, layoutId: 'qwerty-latam', errorSummary: { totalKeystrokes: 2, totalErrors: 0, keys: [{ expected: 'a', totalPresses: 2, totalErrors: 0 }] },
    telemetry: { version: 1, text: 'ab', startedAt: 1000, pausedMs: 0, events: [
      { sequence: 0, kind: 'input', timestamp: 1000, code: 'KeyA', key: 'a', position: 0, expected: 'a', typed: 'a', correct: true },
      { sequence: 1, kind: 'input', timestamp: 1100, code: 'KeyB', key: 'b', position: 1, expected: 'b', typed: 'b', correct: true },
    ] },
  });

  beforeAll(async () => {
    await prisma.user.upsert({ where: { id: userId }, update: {}, create: { id: userId, email: 'adaptive-e2e@example.test', name: 'Adaptive' } });
    await prisma.practiceText.create({ data: { id: 'adaptive-e2e-text', languageCode: 'es', content: 'ababa casa prueba real', characterSet: ['a','b'] } }).catch(() => undefined);
  });
  afterAll(async () => {
    await prisma.errorSession.deleteMany({ where: { userId } });
    await prisma.practiceSession.deleteMany({ where: { userId } });
    await prisma.keyStat.deleteMany({ where: { userId } });
    await prisma.keyLayoutStat.deleteMany({ where: { userId } });
    await prisma.bigramStat.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('es idempotente y no duplica agregados', async () => {
    await service.savePractice(userId, telemetry('11111111-1111-4111-8111-111111111111') as any);
    await service.savePractice(userId, telemetry('11111111-1111-4111-8111-111111111111') as any);
    expect(await prisma.practiceSession.count({ where: { userId } })).toBe(1);
    expect((await prisma.keyLayoutStat.findFirst({ where: { userId, keyChar: 'a' } }))?.totalPresses).toBe(1);
    expect((await prisma.bigramStat.findFirst({ where: { userId, firstChar: 'a', secondChar: 'b' } }))?.totalPresses).toBe(1);
  });

  it('controla dos envíos concurrentes', async () => {
    await Promise.all([service.savePractice(userId, telemetry('22222222-2222-4222-8222-222222222222') as any), service.savePractice(userId, telemetry('22222222-2222-4222-8222-222222222222') as any)]);
    expect(await prisma.practiceSession.count({ where: { userId, clientSessionId: '22222222-2222-4222-8222-222222222222' } })).toBe(1);
  });

  it('no persiste como débil un error corregido con Backspace', async () => {
    const clientSessionId = '33333333-3333-4333-8333-333333333333';
    await service.savePractice(userId, {
      clientSessionId,
      netWpm: 0,
      grossWpm: 0,
      accuracy: 0,
      timeElapsed: 1,
      language: 'es',
      layoutId: 'qwerty-latam',
      errorSummary: {
        totalKeystrokes: 4,
        totalErrors: 1,
        keys: [{ expected: 'a', totalPresses: 2, totalErrors: 1 }],
      },
      telemetry: {
        version: 1,
        text: 'cat',
        startedAt: 1000,
        pausedMs: 0,
        events: [
          { sequence: 0, kind: 'input', timestamp: 1000, code: 'KeyC', key: 'c', position: 0, expected: 'c', typed: 'c', correct: true },
          { sequence: 1, kind: 'input', timestamp: 1100, code: 'KeyX', key: 'x', position: 1, expected: 'a', typed: 'x', correct: false },
          { sequence: 2, kind: 'backspace', timestamp: 1150, code: 'Backspace', key: 'Backspace', position: 2 },
          { sequence: 3, kind: 'input', timestamp: 1200, code: 'KeyA', key: 'a', position: 1, expected: 'a', typed: 'a', correct: true },
          { sequence: 4, kind: 'input', timestamp: 1300, code: 'KeyT', key: 't', position: 2, expected: 't', typed: 't', correct: true },
        ],
      },
    } as any);

    const session = await prisma.practiceSession.findUnique({
      where: { userId_clientSessionId: { userId, clientSessionId } },
    });
    const key = await prisma.keyLayoutStat.findUnique({
      where: { userId_languageCode_layoutId_keyChar: { userId, languageCode: 'es', layoutId: 'qwerty-latam', keyChar: 'a' } },
    });
    const globalKey = await prisma.keyStat.findUnique({
      where: { userId_languageCode_localeCode_keyChar: { userId, languageCode: 'es', localeCode: 'es-latam', keyChar: 'a' } },
    });
    const bigram = await prisma.bigramStat.findUnique({
      where: { userId_languageCode_layoutId_firstChar_secondChar: { userId, languageCode: 'es', layoutId: 'qwerty-latam', firstChar: 'c', secondChar: 'a' } },
    });

    expect(session?.accuracy).toBe(100);
    expect((session?.derivedMetrics as { correctedErrors?: number })?.correctedErrors).toBe(1);
    expect(key?.totalErrors).toBe(0);
    expect(globalKey?.totalErrors).toBe(0);
    expect(bigram?.totalErrors).toBe(0);
    expect(await prisma.keyLayoutStat.findFirst({ where: { userId, keyChar: 'x' } })).toBeNull();
  });

  it('devuelve ejercicio adaptativo separado por layout e idioma', async () => {
    await prisma.keyLayoutStat.upsert({ where: { userId_languageCode_layoutId_keyChar: { userId, languageCode: 'es', layoutId: 'qwerty-latam', keyChar: 'a' } }, update: { totalPresses: 30, totalErrors: 20, errorRate: 66 }, create: { userId, languageCode: 'es', layoutId: 'qwerty-latam', keyChar: 'a', totalPresses: 30, totalErrors: 20, errorRate: 66 } });
    await prisma.bigramStat.create({ data: { userId, languageCode: 'es', layoutId: 'qwerty-latam', firstChar: 'a', secondChar: 'b', totalPresses: 20, totalErrors: 10, averageLatencyMs: 300, latencySamples: 20 } }).catch(() => undefined);
    const adaptive = await service.getNextAdaptiveExercise(userId, 'es', 'qwerty-latam', 'text');
    const empty = await service.getNextAdaptiveExercise(userId, 'en', 'qwerty-en', 'text');
    expect(adaptive.targets.keys).toContain('a');
    expect(adaptive.text).toContain('a');
    expect(empty.targets.keys).toEqual([]);
  });

  it.each([
    ['secuencia duplicada', (events: any[]) => { events[1].sequence = 0; }],
    ['secuencia discontinua', (events: any[]) => { events[1].sequence = 2; }],
    ['timestamp decreciente', (events: any[]) => { events[1].timestamp = 999; }],
    ['posición fuera del texto', (events: any[]) => { events[1].position = 9; }],
    ['carácter esperado incorrecto', (events: any[]) => { events[1].expected = 'x'; }],
    ['layout inexistente', (events: any[], payload: any) => { payload.layoutId = 'inventado'; }],
    ['exceso de eventos', (_events: any[], payload: any) => { payload.telemetry.events = Array.from({ length: 20001 }, (_, sequence) => ({ sequence, kind: 'control', timestamp: 1000 + sequence, code: 'KeyA', key: 'a', position: 0 })); }],
    ['pausa inválida', (_events: any[], payload: any) => { payload.telemetry.pausedMs = 99999; }],
  ])('rechaza %s sin escrituras parciales', async (_name, mutate) => {
    const id = crypto.randomUUID();
    const payload: any = telemetry(id);
    mutate(payload.telemetry.events, payload);
    const before = await Promise.all([prisma.practiceSession.count({ where: { userId } }), prisma.keyLayoutStat.count({ where: { userId } }), prisma.bigramStat.count({ where: { userId } })]);
    await expect(service.savePractice(userId, payload)).rejects.toBeDefined();
    const after = await Promise.all([prisma.practiceSession.count({ where: { userId } }), prisma.keyLayoutStat.count({ where: { userId } }), prisma.bigramStat.count({ where: { userId } })]);
    expect(after).toEqual(before);
  });
});
