// test/e2e/setup-env.ts
import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';

// Determinar la ruta del archivo .env
const envFilePath = process.env.ENV_FILE
  ? path.resolve(process.cwd(), process.env.ENV_FILE)
  : path.resolve(__dirname, '../../.env');

// Cargar variables si el archivo existe
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  console.warn(`[setup-env] No se encontró archivo .env en: ${envFilePath}`);
}

// Opcional: definir valores por defecto para tests que no dependan de la DB real
process.env.API_JWT_SECRET ||= 'test-jwt-secret';
process.env.POSTGRES_HOST ||= 'localhost';
process.env.POSTGRES_DB ||= 'test-db';
process.env.POSTGRES_USER ||= 'user';
process.env.POSTGRES_PASSWORD ||= 'password';
process.env.REDIS_HOST ||= 'localhost';
process.env.MINIO_ENDPOINT ||= 'http://localhost:9000';
process.env.MINIO_ACCESS_KEY ||= 'minio';
process.env.MINIO_SECRET_KEY ||= 'minio123';
process.env.MINIO_BUCKET ||= 'test-bucket';
