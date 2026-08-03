// src/errors/errors.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ErrorTrackingService } from './error-tracking.service';
import { WeakKeysService } from './weak-keys.service';
import { WeakKeysController } from './weak-keys.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WeakKeysController],
  providers: [ErrorTrackingService, WeakKeysService],
  exports: [ErrorTrackingService, WeakKeysService],
})
export class ErrorsModule {}
