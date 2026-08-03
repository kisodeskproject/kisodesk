// src/progress/progress.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  async getProgress(@Req() req: FastifyRequest, @Query('locale') locale?: string) {
    const userId = req.user!.id; // el signo ! porque sabemos que el guard lo asigna
    return this.progressService.getProgress(userId, locale);
  }

  @Get('calendar')
  async getCalendar(@Req() req: FastifyRequest, @Query('locale') locale?: string) {
    const userId = req.user!.id;
    return this.progressService.getCalendar(userId, locale);
  }
}
