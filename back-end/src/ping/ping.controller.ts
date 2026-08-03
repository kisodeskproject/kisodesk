import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  get() {
    return { pong: true, ts: new Date().toISOString() };
  }
}
