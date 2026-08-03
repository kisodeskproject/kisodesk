import cookie from '@fastify/cookie';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { InjectPayload } from 'light-my-request';

import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/global-http-exception.filter';
import { RequestIdInterceptor } from '../../src/common/interceptors/request-id.interceptor';
import { AppTestModule } from './app.test.module';

const PREFIX = 'e2e-profile-';
let sequence = 0;

type Client = { id: string; email: string; cookie: string; remoteAddress: string };

describe('Profile self-service (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const nextAddress = () => `10.3.${(Date.now() % 200) + 1}.${10 + ++sequence}`;

  const createUser = async (name: string): Promise<Client> => {
    const suffix = `${Date.now()}-${sequence++}`;
    const email = `${PREFIX}${suffix}@example.test`;
    const remoteAddress = nextAddress();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      remoteAddress,
      payload: {
        email,
        password: 'ProfileE2E123',
        username: `${name}-${sequence}`,
        termsAccepted: true,
        privacyAccepted: true,
      },
    });
    expect(response.statusCode).toBe(200);
    return {
      id: response.json().user.id,
      email,
      cookie: response.cookies.map(({ name: cookieName, value }) => `${cookieName}=${value}`).join('; '),
      remoteAddress,
    };
  };

  const request = (client: Client, method: 'GET' | 'PATCH' | 'DELETE', url: string, payload?: InjectPayload) =>
    app.inject({ method, url, payload, remoteAddress: client.remoteAddress, headers: { cookie: client.cookie } });

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toContain('typing_test');
    const module = await Test.createTestingModule({ imports: [AppTestModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new RequestIdInterceptor());
    await app.register(cookie as never);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('v1', { exclude: [{ path: 'health', method: RequestMethod.ALL }] });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    const database = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`;
    expect(database[0].current_database).toBe('typing_test');
  });

  afterAll(async () => {
    await prisma.practiceSession.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.userRankingCache.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await app.close();
  });

  it('requiere autenticación y no permite modificar otro perfil mediante el cuerpo', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/users/me' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/v1/users/me/export' })).statusCode).toBe(401);

    const user = await createUser('authenticated');
    const response = await request(user, 'PATCH', '/v1/users/me', { name: 'Changed', userId: 'other-user' });
    expect(response.statusCode).toBe(400);
    expect((await request(user, 'PATCH', '/v1/users/me', { interfaceLanguage: 'fr' })).statusCode).toBe(400);
    expect((await request(user, 'PATCH', '/v1/users/me', { layout: 'UNKNOWN_LAYOUT' })).statusCode).toBe(400);
    expect((await request(user, 'PATCH', '/v1/users/me', { publicAlias: 'invalid alias' })).statusCode).toBe(400);
    expect((await request(user, 'GET', '/v1/users/me')).json().id).toBe(user.id);
  });

  it('persiste nombre, alias, idioma, layout y preferencias con valores admitidos', async () => {
    const user = await createUser('preferences');
    const profile = await request(user, 'GET', '/v1/users/me');
    expect(profile.statusCode).toBe(200);
    expect(profile.json()).toEqual(expect.objectContaining({ id: user.id, email: user.email }));

    const update = await request(user, 'PATCH', '/v1/users/me', {
      name: 'Nombre actualizado',
      publicAlias: 'Alias_Profile',
      interfaceLanguage: 'en',
      layout: 'QWERTY_US',
      showInRanking: false,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toEqual(expect.objectContaining({
      id: user.id,
      name: 'Nombre actualizado',
      publicAlias: 'alias_profile',
      interfaceLanguage: 'en',
      layout: 'QWERTY_US',
      showInRanking: false,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    }));

    const reloaded = await request(user, 'GET', '/v1/users/me');
    expect(reloaded.json()).toEqual(expect.objectContaining({
      name: 'Nombre actualizado',
      publicAlias: 'alias_profile',
      interfaceLanguage: 'en',
      layout: 'QWERTY_US',
      showInRanking: false,
    }));
  });

  it('rechaza alias inválido o duplicado y permite reintentar con otro alias', async () => {
    const [first, second] = await Promise.all([createUser('alias-first'), createUser('alias-second')]);
    expect((await request(first, 'PATCH', '/v1/users/me', { publicAlias: 'shared_profile_alias' })).statusCode).toBe(200);
    expect((await request(second, 'PATCH', '/v1/users/me', { publicAlias: 'x' })).statusCode).toBe(400);
    expect((await request(second, 'PATCH', '/v1/users/me', { publicAlias: 'SHARED_PROFILE_ALIAS' })).statusCode).toBe(400);
    const retry = await request(second, 'PATCH', '/v1/users/me', { publicAlias: 'unique_profile_alias' });
    expect(retry.statusCode).toBe(200);
    expect(retry.json().publicAlias).toBe('unique_profile_alias');
  });

  it('oculta y restaura al usuario en el ranking sin exponer datos privados', async () => {
    const user = await createUser('ranking-privacy');
    const practice = await request(user, 'PATCH', '/v1/users/me', { publicAlias: 'ranking_profile_alias' });
    expect(practice.statusCode).toBe(200);
    const saved = await app.inject({
      method: 'POST',
      url: '/v1/practice/results',
      remoteAddress: user.remoteAddress,
      headers: { cookie: user.cookie },
      payload: {
        language: 'es', netWpm: 250, grossWpm: 255, accuracy: 96, timeElapsed: 60,
        errorSummary: { totalKeystrokes: 1, totalErrors: 0, keys: [{ expected: 'a', totalPresses: 1, totalErrors: 0 }] },
      },
    });
    expect(saved.statusCode).toBe(201);
    const visible = await app.inject({ method: 'GET', url: '/v1/ranking?language=es&limit=100' });
    expect(visible.json().ranking.find((entry: { id: string }) => entry.id === user.id)).toEqual(
      expect.objectContaining({ name: 'ranking_profile_alias' }),
    );

    expect((await request(user, 'PATCH', '/v1/users/me', { showInRanking: false })).statusCode).toBe(200);
    const hidden = await app.inject({ method: 'GET', url: '/v1/ranking?language=es&limit=100' });
    expect(hidden.json().ranking.find((entry: { id: string }) => entry.id === user.id)).toBeUndefined();
    expect(hidden.json().ranking.every((entry: Record<string, unknown>) => !('email' in entry))).toBe(true);

    expect((await request(user, 'PATCH', '/v1/users/me', { showInRanking: true })).statusCode).toBe(200);
    const restored = await app.inject({ method: 'GET', url: '/v1/ranking?language=es&limit=100' });
    expect(restored.json().ranking.some((entry: { id: string }) => entry.id === user.id)).toBe(true);
  });

  it('permite borrar el alias solo sin funciones sociales públicas activas', async () => {
    const user = await createUser('clear-alias');
    const disable = await request(user, 'PATCH', '/v1/users/me', {
      showInRanking: false,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    });
    expect(disable.statusCode).toBe(200);
    expect((await request(user, 'PATCH', '/v1/users/me', { publicAlias: null })).json().publicAlias).toBeNull();
    expect((await request(user, 'PATCH', '/v1/users/me', { showInRanking: true })).statusCode).toBe(400);
  });

  it('rechaza una versión antigua y permite guardar después de recargar el perfil', async () => {
    const user = await createUser('conflict');
    const firstTab = await request(user, 'GET', '/v1/users/me');
    const secondTab = await request(user, 'GET', '/v1/users/me');
    const firstVersion = firstTab.json().updatedAt;
    const secondVersion = secondTab.json().updatedAt;

    expect((await request(user, 'PATCH', '/v1/users/me', {
      name: 'Cambio primera pestaña', updatedAt: firstVersion,
    })).statusCode).toBe(200);
    expect((await request(user, 'PATCH', '/v1/users/me', {
      name: 'Cambio segunda pestaña', updatedAt: secondVersion,
    })).statusCode).toBe(409);

    const current = await request(user, 'GET', '/v1/users/me');
    expect((await request(user, 'PATCH', '/v1/users/me', {
      name: 'Cambio tras recarga', updatedAt: current.json().updatedAt,
    })).statusCode).toBe(200);
  });

  it('exporta únicamente los datos autenticados, sin secretos, y elimina la cuenta confirmada', async () => {
    const user = await createUser('export-delete');
    const exported = await request(user, 'GET', '/v1/users/me/export');
    expect(exported.statusCode).toBe(200);
    expect(exported.headers['content-type']).toContain('application/json');
    expect(exported.headers['cache-control']).toBe('private, no-store');
    expect(exported.headers['content-disposition']).toMatch(/^attachment; filename="account-data-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(exported.json()).toEqual(expect.objectContaining({ schemaVersion: 1, account: expect.objectContaining({ email: user.email }) }));
    expect(exported.json().account).not.toHaveProperty('passwordHash');
    expect(exported.json().account.refreshTokens[0]).not.toHaveProperty('token');

    expect((await request(user, 'DELETE', '/v1/users/me', {
      currentPassword: 'ProfileE2E123', confirmationEmail: user.email,
    })).statusCode).toBe(204);
    expect((await request(user, 'GET', '/v1/users/me')).statusCode).toBe(401);
  });
});
