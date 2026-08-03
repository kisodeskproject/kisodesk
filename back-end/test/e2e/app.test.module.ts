// test/e2e/app.test.module.ts
import { Module } from '@nestjs/common';

import { AppModule } from '../../src/app.module';

@Module({
  // La aplicación E2E usa los módulos reales, incluido Prisma y PostgreSQL.
  // Redis puede no estar disponible localmente: RedisThrottlerStorage usa su
  // fallback en memoria sin alterar auth, prácticas ni ranking.
  imports: [AppModule],
})
export class AppTestModule {}
