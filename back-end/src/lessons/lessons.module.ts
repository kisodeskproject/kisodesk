// src/lessons/lessons.module.ts
import { Module } from '@nestjs/common';

import { CourseLessonsController } from './course-lessons.controller';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ErrorsModule } from '../errors/errors.module';
import { ProgressModule } from '../progress/progress.module';
import { TelemetryService } from '../practice/telemetry.service';

@Module({
  imports: [PrismaModule, ErrorsModule, ProgressModule],
  controllers: [LessonsController, CourseLessonsController],
  providers: [LessonsService, TelemetryService],
  exports: [LessonsService],
})
export class LessonsModule {}
