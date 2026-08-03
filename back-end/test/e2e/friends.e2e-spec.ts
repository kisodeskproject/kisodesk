import cookie from '@fastify/cookie';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppTestModule } from './app.test.module';

const PREFIX = 'e2e-friends-';
let sequence = 0;
type Client = { id: string; cookie: string; address: string };

describe('Friends (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  const createUser = async (alias: string): Promise<Client> => {
    const suffix = `${Date.now()}-${sequence++}`;
    const address = `10.4.${(Date.now() % 200) + 1}.${10 + sequence}`;
    const response = await app.inject({ method: 'POST', url: '/v1/auth/register', remoteAddress: address, payload: {
      email: `${PREFIX}${suffix}@example.test`, password: 'FriendsE2E123', username: `${alias}-${suffix}`,
      termsAccepted: true, privacyAccepted: true,
    } });
    expect(response.statusCode).toBe(200);
    return { id: response.json().user.id, address, cookie: response.cookies.map(({ name, value }) => `${name}=${value}`).join('; ') };
  };
  const request = (client: Client, method: 'GET' | 'POST' | 'DELETE', url: string, payload?: object) =>
    app.inject({ method, url, payload, remoteAddress: client.address, headers: { cookie: client.cookie } });

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toContain('typing_test');
    const module = await Test.createTestingModule({ imports: [AppTestModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.register(cookie as any);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('v1', { exclude: [{ path: 'health', method: RequestMethod.ALL }] });
    await app.init(); await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
    expect((await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`)[0].current_database).toBe('typing_test');
  });
  afterAll(async () => {
    await prisma.friendship.deleteMany({ where: { requester: { email: { startsWith: PREFIX } } } });
    await prisma.friendship.deleteMany({ where: { addressee: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await app.close();
  });

  it('requiere autenticación y busca solo aliases públicos', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/friends' })).statusCode).toBe(401);
    const [a, b] = await Promise.all([createUser('search-alpha'), createUser('search-beta')]);
    const result = await request(a, 'GET', '/v1/friends/search?q=search&limit=20');
    expect(result.statusCode).toBe(200);
    const user = result.json().users.find((entry: { id: string }) => entry.id === b.id);
    expect(user).toEqual(expect.objectContaining({ name: expect.any(String), friendshipStatus: 'none' }));
    expect(user).not.toHaveProperty('email');
  });

  it('serializa solicitudes iguales y opuestas con una sola relación pendiente', async () => {
    const [a, b] = await Promise.all([createUser('concurrent-a'), createUser('concurrent-b')]);
    const responses = await Promise.all([
      request(a, 'POST', '/v1/friends/requests', { friendId: b.id }),
      request(a, 'POST', '/v1/friends/requests', { friendId: b.id }),
      request(b, 'POST', '/v1/friends/requests', { friendId: a.id }),
    ]);
    expect(responses.every((response) => response.statusCode !== 500)).toBe(true);
    expect(responses.filter((response) => response.statusCode === 200 || response.statusCode === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.statusCode === 409)).toHaveLength(2);
    expect(await prisma.friendship.count({ where: { OR: [{ requesterId: a.id, addresseeId: b.id }, { requesterId: b.id, addresseeId: a.id }] } })).toBe(1);
  });

  it('acepta una vez, protege acciones ajenas y elimina una amistad una sola vez', async () => {
    const [a, b, outsider] = await Promise.all([createUser('accept-a'), createUser('accept-b'), createUser('outsider')]);
    const sent = await request(a, 'POST', '/v1/friends/requests', { friendId: b.id });
    const requestId = sent.json().id;
    expect((await request(outsider, 'POST', `/v1/friends/requests/${requestId}/accept`)).statusCode).toBe(404);
    const accepted = await Promise.all([
      request(b, 'POST', `/v1/friends/requests/${requestId}/accept`),
      request(b, 'POST', `/v1/friends/requests/${requestId}/accept`),
    ]);
    expect(accepted.some((response) => response.statusCode === 201)).toBe(true);
    expect(accepted.every((response) => response.statusCode !== 500)).toBe(true);
    expect((await prisma.friendship.findFirstOrThrow({ where: { id: requestId } })).status).toBe('ACCEPTED');
    const removed = await Promise.all([request(a, 'DELETE', `/v1/friends/${b.id}`), request(a, 'DELETE', `/v1/friends/${b.id}`)]);
    expect(removed.some((response) => response.statusCode === 200)).toBe(true);
    expect(removed.every((response) => response.statusCode !== 500)).toBe(true);
  });

  it('aplica privacidad, bloqueo, solicitudes y presencia', async () => {
    const [a, b] = await Promise.all([createUser('privacy-a'), createUser('privacy-b')]);
    expect((await request(a, 'POST', '/v1/friends/requests', { friendId: a.id })).statusCode).toBe(400);
    await prisma.user.update({ where: { id: b.id }, data: { allowFriendRequests: false } });
    expect((await request(a, 'POST', '/v1/friends/requests', { friendId: b.id })).statusCode).toBe(403);
    await prisma.user.update({ where: { id: b.id }, data: { allowFriendRequests: true } });
    const sent = await request(a, 'POST', '/v1/friends/requests', { friendId: b.id });
    expect((await request(b, 'GET', '/v1/friends/requests')).json().incoming).toEqual(expect.arrayContaining([expect.objectContaining({ id: sent.json().id })]));
    expect((await request(b, 'POST', `/v1/friends/requests/${sent.json().id}/reject`)).statusCode).toBe(201);
    expect((await request(a, 'POST', `/v1/friends/${b.id}/block`)).statusCode).toBe(201);
    expect((await request(b, 'POST', '/v1/friends/requests', { friendId: a.id })).statusCode).toBe(403);
    expect((await request(a, 'DELETE', `/v1/friends/${b.id}/block`)).statusCode).toBe(200);
    expect((await request(a, 'POST', '/v1/friends/presence/ping')).statusCode).toBe(201);
  });
});
