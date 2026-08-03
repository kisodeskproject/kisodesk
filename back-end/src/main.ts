// src/main.ts
import 'reflect-metadata';
import './tracing';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ValidationPipe, RequestMethod, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/global-http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

export function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins.map((origin) => new URL(origin).origin);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ALLOWED_ORIGINS is required in production');
  }

  return ['http://localhost:3001'];
}

export async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: isProduction ? false : { level: 'debug' },
      bodyLimit: 1_048_576,
      // La API solo se expone dentro de la red Docker; Nginx termina TLS y reenvía estos headers.
      // No se confían encabezados enviados por clientes fuera de las redes de loopback/Docker.
      trustProxy: isProduction ? ['127.0.0.1', '::1', '172.18.0.0/16'] : false,
    }),
    {
      bufferLogs: true,
    },
  );

  app.useLogger(logger);
  app.flushLogs();
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  await app.register(cors as any, {
    origin: getAllowedOrigins(),
    credentials: true,
  });

  if (!isProduction) {
    await app.register(helmet as any, {
      contentSecurityPolicy: false,
    });
  }

  await app.register(compress as any);
  await app.register(cookie as any);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/*path', method: RequestMethod.ALL },
      { path: 'metrics', method: RequestMethod.ALL },
    ],
  });

  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 3000);

  await app.listen(port, '0.0.0.0');

  logger.log(
    `Application running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`,
  );
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Failed to start application:', err instanceof Error ? err.name : 'UnknownError');
    process.exit(1);
  });
}
