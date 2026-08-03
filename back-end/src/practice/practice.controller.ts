// src/practice/practice.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LanguageCode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FastifyRequest } from 'fastify';

import { SavePracticeDto } from './dto/save-practice.dto';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GetTextQueryDto {
  @IsEnum(LanguageCode)
  lang!: LanguageCode;

  @IsOptional()
  @IsString()
  excludeIds?: string;
}

class AdaptiveExerciseQueryDto {
  @IsEnum(LanguageCode)
  lang!: LanguageCode;

  @IsString()
  layoutId!: string;

  @IsOptional()
  @IsString()
  mode?: 'words' | 'text';
}

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('results')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async saveResult(@Req() req: FastifyRequest, @Body() dto: SavePracticeDto) {
    const userId = req.user!.id;
    return this.practiceService.savePractice(userId, dto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: FastifyRequest) {
    const userId = req.user!.id;
    return this.practiceService.getStatsForUser(userId);
  }

  @Get('texts')
  async getRandomText(@Query() query: GetTextQueryDto) {
    const excludedIds =
      query.excludeIds
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100) ?? [];
    return this.practiceService.getRandomText(query.lang, excludedIds);
  }

  @Get('adaptive/next')
  @UseGuards(JwtAuthGuard)
  async getNextAdaptiveExercise(@Req() req: FastifyRequest, @Query() query: AdaptiveExerciseQueryDto) {
    return this.practiceService.getNextAdaptiveExercise(
      req.user!.id,
      query.lang,
      query.layoutId,
      query.mode === 'words' ? 'words' : 'text',
    );
  }
}
