// src/lessons/lessons.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { Role, LanguageCode } from '@prisma/client';

import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { SubmitLessonErrorsDto } from './dto/submit-lesson-errors.dto';
import { LessonsService } from './lessons.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(@Param('id') id: string, @Req() req: any, @Body() dto: CompleteLessonDto) {
    const userId = req.user.id;
    return this.lessonsService.saveProgress(userId, id, dto);
  }

  @Post(':lessonId/errors')
  @UseGuards(JwtAuthGuard)
  async submitErrors(
    @Param('lessonId') lessonId: string,
    @Req() req: any,
    @Body() dto: SubmitLessonErrorsDto,
  ) {
    const userId = req.user.id;
    const userLanguage = req.user.language || LanguageCode.es;
    return this.lessonsService.submitErrors(userId, lessonId, dto, userLanguage);
  }
}
