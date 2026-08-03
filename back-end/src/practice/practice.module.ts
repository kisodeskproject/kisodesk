// src/practice/practice.module.ts
import { Module } from '@nestjs/common';

import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ErrorsModule } from '../errors/errors.module';
import { ProgressModule } from '../progress/progress.module';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [PrismaModule, ErrorsModule, ProgressModule],
  controllers: [PracticeController],
  providers: [PracticeService, TelemetryService],
  exports: [PracticeService],
})
export class PracticeModule {}
