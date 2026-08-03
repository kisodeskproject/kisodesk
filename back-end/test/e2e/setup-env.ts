// test/e2e/setup-env.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

if (!process.env.DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL_TEST es obligatoria para E2E');
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = 'test';
process.env.API_JWT_SECRET ??= 'e2e-ranking-jwt-secret-not-for-production';
process.env.POSTGRES_HOST ??= '127.0.0.1';
process.env.POSTGRES_PORT ??= '5433';
process.env.POSTGRES_DB ??= 'typing_test';
process.env.POSTGRES_USER ??= 'typing_test';
process.env.POSTGRES_PASSWORD ??= 'typing_test';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '6380';
process.env.MINIO_ENDPOINT ??= 'http://127.0.0.1';
