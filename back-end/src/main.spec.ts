// src/main.spec.ts

jest.mock('@nestjs/core', () => {
  const listen = jest.fn().mockResolvedValue(undefined);
  const register = jest.fn().mockResolvedValue(undefined);
  const setGlobalPrefix = jest.fn();
  const get = jest.fn().mockReturnValue({ enableCors: jest.fn() });
  return {
    NestFactory: {
      create: jest.fn().mockResolvedValue({
        listen,
        get,
        register,
        setGlobalPrefix,
        enableShutdownHooks: jest.fn(),
        useLogger: jest.fn(),
        flushLogs: jest.fn(),
        useGlobalPipes: jest.fn(),
        useGlobalFilters: jest.fn(),
        useGlobalInterceptors: jest.fn(),
        use: jest.fn(),
      }),
    },
  };
});

describe('bootstrap(main.ts)', () => {
  const OLD_ENV = process.env;

  const runMain = async () => {
    const id = require.resolve('./main');
    delete require.cache[id];
    const mod = require('./main');
    await mod.bootstrap();
    return require('@nestjs/core').NestFactory as any;
  };

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      API_PORT: '3000',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3001',
      ENV_FILE: '.env',
      API_JWT_SECRET: 'dummy-secret-123456',
      POSTGRES_HOST: 'localhost',
      POSTGRES_DB: 'typing',
      POSTGRES_USER: 'typing',
      POSTGRES_PASSWORD: 'typing',
      REDIS_HOST: 'localhost',
      MINIO_ENDPOINT: 'http://minio:9000',
      MINIO_ACCESS_KEY: 'typing',
      MINIO_SECRET_KEY: 'typing',
      MINIO_BUCKET: 'typing-assets',
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('arranca y aplica prefijo y listen', async () => {
    const NestFactory = await runMain();
    expect(NestFactory.create).toHaveBeenCalled();
    const app = await NestFactory.create.mock.results[0].value;
    expect(app.setGlobalPrefix).toHaveBeenCalled();
    expect(app.register).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(String));
  });

  it('configura CORS con una lista explícita de orígenes', async () => {
    process.env.CORS_ALLOWED_ORIGINS =
      'https://keyrivo.example, https://admin.keyrivo.example/path';
    const NestFactory = await runMain();
    const app = await NestFactory.create.mock.results.at(-1).value;
    const corsRegistration = (app.register as jest.Mock).mock.calls[0];

    expect(corsRegistration[1]).toEqual({
      origin: ['https://keyrivo.example', 'https://admin.keyrivo.example'],
      credentials: true,
    });
  });

  it('rechaza producción sin una lista explícita de CORS', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ALLOWED_ORIGINS;

    await expect(runMain()).rejects.toThrow('CORS_ALLOWED_ORIGINS is required in production');
  });

  it('registra siempre los 4 plugins de Fastify (cors, helmet, compress, cookie)', async () => {
    process.env.NODE_ENV = 'development';
    // La variable METRICS_DISABLED no afecta estos plugins
    const NestFactory = await runMain();
    const app = await NestFactory.create.mock.results.at(-1).value;
    // Siempre se registran cors, helmet, compress y cookie
    expect((app.register as jest.Mock).mock.calls.length).toBe(4);
  });

  it('usa puerto por defecto cuando API_PORT no está definido', async () => {
    delete process.env.API_PORT;
    const NestFactory = await runMain();
    const app = await NestFactory.create.mock.results.at(-1).value;
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(String));
  });
});
