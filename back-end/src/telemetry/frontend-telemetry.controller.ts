import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { FrontendTelemetryBatchDto } from './dto/frontend-telemetry.dto';
import { FrontendTelemetryService } from './frontend-telemetry.service';

@Controller('telemetry')
export class FrontendTelemetryController {
  constructor(private readonly telemetry: FrontendTelemetryService) {}

  @Post('frontend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ global: { limit: 30, ttl: 60_000 } })
  collect(@Body() body: FrontendTelemetryBatchDto) {
    this.telemetry.record(body.events);
  }
}
