// src/errors/weak-keys.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { LanguageCode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { WeakKeysService } from './weak-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class WeakKeysQueryDto {
  @IsEnum(LanguageCode)
  @IsOptional()
  lang?: LanguageCode;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

@Controller('me')
@UseGuards(JwtAuthGuard)
export class WeakKeysController {
  constructor(private readonly weakKeysService: WeakKeysService) {}

  @Get('weak-keys')
  async getWeakKeys(@Req() req: any, @Query() query: WeakKeysQueryDto) {
    const userId = req.user.id;
    return this.weakKeysService.getWeakKeys(userId, query.lang);
  }

  @Get('error-heatmap')
  async getErrorHeatmap(@Req() req: any, @Query() query: WeakKeysQueryDto) {
    const userId = req.user.id;
    return this.weakKeysService.getErrorHeatmap(userId, query.lang);
  }

  @Get('error-trends')
  async getErrorTrends(@Req() req: any, @Query() query: WeakKeysQueryDto) {
    const userId = req.user.id;
    return this.weakKeysService.getErrorTrends(userId, query.lang, query.from, query.to);
  }

  @Get('personalized-lesson')
  async getPersonalizedLesson(@Req() req: any, @Query('lang') lang?: LanguageCode) {
    const userId = req.user.id;
    return this.weakKeysService.getPersonalizedLesson(userId, lang);
  }
}
