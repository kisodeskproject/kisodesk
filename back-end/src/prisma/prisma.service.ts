// /src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { buildDatabaseUrl } from '../config/database';

// Asegura que DATABASE_URL esté definida
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl();
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }
  async onModuleInit() {
    await this.$connect();
    console.log('[Prisma] Conectado a la base de datos.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[Prisma] Conexión cerrada.');
  }
}
