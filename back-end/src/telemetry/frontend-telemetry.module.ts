import { Module } from '@nestjs/common';

import { FrontendTelemetryController } from './frontend-telemetry.controller';
import { FrontendTelemetryService } from './frontend-telemetry.service';

@Module({
  controllers: [FrontendTelemetryController],
  providers: [FrontendTelemetryService],
})
export class FrontendTelemetryModule {}
