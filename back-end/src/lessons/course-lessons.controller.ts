// src/lessons/course-lessons.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AddLessonToCourseDto } from './dto/add-lesson-to-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonsService } from './lessons.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('courses/:courseId/lessons')
export class CourseLessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  //@UseGuards(JwtAuthGuard)
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Param('courseId') courseId: string, @Req() req: any) {
    const userId = req.user?.id || null;
    return this.lessonsService.findAllByCourse(courseId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Param('courseId') courseId: string, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(courseId, dto);
  }

  @Post(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  addExistingLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: AddLessonToCourseDto,
  ) {
    return this.lessonsService.addLessonToCourse(courseId, lessonId, dto.order);
  }

  @Delete(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeLessonFromCourse(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    return this.lessonsService.removeLessonFromCourse(courseId, lessonId);
  }
}
