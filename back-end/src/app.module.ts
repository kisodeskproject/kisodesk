// src/app.module.ts
import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ErrorsModule } from './errors/errors.module';
import { HealthModule } from './health/health.module';
import { LessonsModule } from './lessons/lessons.module';
import { MetricsModule } from './metrics/metrics.module';
import { PingModule } from './ping/ping.module';
import { PracticeModule } from './practice/practice.module';
import { FriendsModule } from './friends/friends.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { RankingModule } from './ranking/ranking.module';
import { RedisThrottlerStorage } from './rate-limit/redis-throttler.storage';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { FrontendTelemetryModule } from './telemetry/frontend-telemetry.module';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function getEnvironmentValidationSchema(nodeEnv = process.env.NODE_ENV) {
  const isProduction = nodeEnv === 'production';

  return Joi.object({
    API_PORT: Joi.number().port().default(3000),
    API_JWT_SECRET: Joi.string().min(16).required(),
    APP_PUBLIC_URL: Joi.string().uri().default('http://localhost:3001'),
    CORS_ALLOWED_ORIGINS: Joi.string().optional(),
    AUTH_COOKIE_DOMAIN: isProduction
      ? Joi.string()
          .pattern(/^\.[a-z0-9.-]+$/i)
          .required()
      : Joi.string().allow('').optional(),

    TURNSTILE_SECRET_KEY: Joi.string().allow('').optional(),

    SMTP_HOST: Joi.string().hostname().allow('').optional(),
    SMTP_PORT: Joi.number().port().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.string().allow('').optional(),
    SMTP_PASSWORD: Joi.string().allow('').optional(),
    MAIL_FROM: Joi.string().email().default('no-reply@example.com'),
    PASSWORD_RESET_TOKEN_TTL_MINUTES: Joi.number().integer().min(5).max(1440).default(60),
    PRODUCT_METRICS_REFRESH_SECONDS: Joi.number().integer().min(60).max(900).default(60),
    PRODUCT_ANALYTICS_REFRESH_SECONDS: Joi.number().integer().min(300).max(3600).default(900),

    POSTGRES_HOST: Joi.string().required(),
    POSTGRES_PORT: Joi.number().port().default(5432),
    POSTGRES_DB: Joi.string().required(),
    POSTGRES_USER: Joi.string().required(),
    POSTGRES_PASSWORD: Joi.string().required(),

    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().port().default(6379),
    REDIS_PASSWORD: isProduction
      ? Joi.string().min(32).required()
      : Joi.string().allow('').optional(),

    MINIO_ENDPOINT: Joi.string().uri({ allowRelative: true }).required(),
    MINIO_PORT: Joi.number().port().default(9000),
    MINIO_CONSOLE_PORT: Joi.number().port().default(9001),

    PROMETHEUS_PORT: Joi.number().port().default(9090),
    GRAFANA_PORT: Joi.number().port().default(3001),
    LOKI_PORT: Joi.number().port().default(3100),
  });
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE ?? '.env',
      validationSchema: getEnvironmentValidationSchema(),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: new RedisThrottlerStorage({
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          keyPrefix: 'typing:rate-limit',
        }),
        throttlers: [
          { name: 'global', limit: 100, ttl: 5 * 60_000 },
          { name: 'auth', limit: 30, ttl: 5 * 60_000 },
        ],
      }),
    }),
    PrismaModule,
    HealthModule,
    PingModule,
    MetricsModule,
    FrontendTelemetryModule,
    UsersModule,
    AuthModule,
    LessonsModule,
    RolesModule,
    CoursesModule,
    RankingModule,
    ProgressModule,
    PracticeModule,
    FriendsModule,
    ErrorsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
