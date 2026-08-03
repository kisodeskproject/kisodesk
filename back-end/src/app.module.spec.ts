import { Test } from '@nestjs/testing';

describe('AppModule', () => {
  const OLD_ENV = process.env;
  let AppModule: any;
  let PrismaService: any;
  let getEnvironmentValidationSchema: typeof import('./app.module').getEnvironmentValidationSchema;

  const baseEnvironment = {
    API_JWT_SECRET: 'dummy-secret-123456',
    POSTGRES_HOST: 'localhost',
    POSTGRES_DB: 'typing',
    POSTGRES_USER: 'typing',
    POSTGRES_PASSWORD: 'typing',
    REDIS_HOST: 'localhost',
    MINIO_ENDPOINT: 'http://minio:9000',
  };

  beforeAll(async () => {
    process.env = {
      ...OLD_ENV,
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
    ({ AppModule, getEnvironmentValidationSchema } = await import('./app.module'));
    ({ PrismaService } = await import('./prisma/prisma.service'));
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('se compila sin errores', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile();

    expect(moduleRef).toBeDefined();
  });

  it('permite entorno local sin dominio de cookie ni contraseña Redis', () => {
    const { error } = getEnvironmentValidationSchema('development').validate(baseEnvironment);

    expect(error).toBeUndefined();
  });

  it('mantiene REDIS_PASSWORD y AUTH_COOKIE_DOMAIN obligatorios en producción', () => {
    const { error } = getEnvironmentValidationSchema('production').validate(baseEnvironment, {
      abortEarly: false,
    });
    const messages = error?.details.map((detail) => detail.message).join(' ') ?? '';

    expect(messages).toContain('AUTH_COOKIE_DOMAIN');
    expect(messages).toContain('REDIS_PASSWORD');
  });
});
