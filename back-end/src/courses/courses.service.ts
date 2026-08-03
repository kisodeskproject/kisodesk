// src/courses/courses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { buildUniqueSlug, isUuid } from '../common/utils/slug.utils';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private async generateCourseSlug(name: string, excludeId?: string) {
    return buildUniqueSlug(
      name,
      async (slug) => {
        const existing = await this.prisma.course.findUnique({
          where: { slug },
          select: { id: true },
        });

        return Boolean(existing && existing.id !== excludeId);
      },
      'course',
    );
  }

  private async findCourseEntity(identifier: string) {
    const course = await this.prisma.course.findFirst({
      where: isUuid(identifier)
        ? { OR: [{ id: identifier }, { slug: identifier }] }
        : { slug: identifier },
      include: {
        courseLessons: {
          include: { lesson: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Curso "${identifier}" no encontrado`);
    }

    return course;
  }

  async create(createCourseDto: CreateCourseDto) {
    const slug = await this.generateCourseSlug(createCourseDto.name);

    return this.prisma.course.create({
      data: {
        name: createCourseDto.name,
        slug,
        description: createCourseDto.description,
        languageCode: createCourseDto.languageCode,
        localeCode: createCourseDto.localeCode,
        level: createCourseDto.level,
        supportedLayouts: createCourseDto.supportedLayouts,
        curriculumVersion: createCourseDto.curriculumVersion,
        estimatedMinutes: createCourseDto.estimatedMinutes,
      },
    });
  }

  async findAll(userId?: string | null) {
    const courses = await this.prisma.course.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        languageCode: true,
        localeCode: true,
        level: true,
        supportedLayouts: true,
        curriculumVersion: true,
        estimatedMinutes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { courseLessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Si no hay usuario autenticado, devolver sin progreso
    if (!userId) {
      return courses.map((course) => ({
        id: course.id,
        slug: course.slug,
        name: course.name,
        description: course.description,
        languageCode: course.languageCode,
        localeCode: course.localeCode,
        level: course.level.toLowerCase(),
        supportedLayouts: course.supportedLayouts,
        curriculumVersion: course.curriculumVersion,
        estimatedMinutes: course.estimatedMinutes,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        lessonsCount: course._count.courseLessons,
        userProgress: null,
      }));
    }

    // Obtener para cada curso los IDs de sus lecciones
    const courseIds = courses.map((c) => c.id);
    const courseLessons = await this.prisma.courseLesson.findMany({
      where: { courseId: { in: courseIds } },
      select: { courseId: true, lessonId: true, lesson: { select: { type: true } } },
    });

    // Mapa de courseId -> array de lessonIds
    const lessonsByCourse = new Map<string, string[]>();
    for (const cl of courseLessons) {
      if (!lessonsByCourse.has(cl.courseId)) {
        lessonsByCourse.set(cl.courseId, []);
      }
      lessonsByCourse.get(cl.courseId)!.push(cl.lessonId);
    }

    // Obtener todo el progreso del usuario en esas lecciones (una sola consulta)
    const allLessonIds = [...new Set(courseLessons.map((cl) => cl.lessonId))];
    const userProgressList = await this.prisma.userLessonProgress.findMany({
      where: {
        userId: userId,
        lessonId: { in: allLessonIds },
      },
    });

    // Mapa de lessonId -> UserLessonProgress
    const progressByLesson = new Map();
    for (const progress of userProgressList) {
      progressByLesson.set(progress.lessonId, progress);
    }

    // Construir respuesta con userProgress por curso
    return courses.map((course) => {
      const lessonIds = lessonsByCourse.get(course.id) || [];
      const courseProgresses = lessonIds
        .map((lessonId) => progressByLesson.get(lessonId))
        .filter((p) => p !== undefined);
      const practiceLessonIds = courseLessons
        .filter((courseLesson) => courseLesson.courseId === course.id)
        .filter((courseLesson) => courseLesson.lesson.type === 'practice')
        .map((courseLesson) => courseLesson.lessonId);
      const practiceProgresses = practiceLessonIds
        .map((lessonId) => progressByLesson.get(lessonId))
        .filter((progress) => progress !== undefined);

      const completedLessons = courseProgresses.filter(
        (progress) => progress.status === 'COMPLETED' || progress.status === 'MASTERED',
      ).length;
      const masteredLessons = courseProgresses.filter(
        (progress) => progress.status === 'MASTERED',
      ).length;
      let bestWpm: number | null = null;
      let totalAccuracy = 0;
      let totalTime = 0;

      if (practiceProgresses.length > 0) {
        bestWpm = Math.max(...practiceProgresses.map((p) => p.bestQualifiedNetWpm));
        totalAccuracy = practiceProgresses.reduce((sum, p) => sum + p.bestAccuracy, 0);
        totalTime = courseProgresses.reduce((sum, p) => sum + p.timeElapsed, 0);
      }

      const avgAccuracy =
        practiceProgresses.length > 0
          ? Math.round(totalAccuracy / practiceProgresses.length)
          : null;

      const userProgress =
        completedLessons > 0
          ? {
              completedLessons,
              masteredLessons,
              bestWpm,
              avgAccuracy,
              totalTimeSpent: totalTime,
            }
          : null;

      return {
        id: course.id,
        slug: course.slug,
        name: course.name,
        description: course.description,
        languageCode: course.languageCode,
        localeCode: course.localeCode,
        level: course.level.toLowerCase(),
        supportedLayouts: course.supportedLayouts,
        curriculumVersion: course.curriculumVersion,
        estimatedMinutes: course.estimatedMinutes,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        lessonsCount: course._count.courseLessons,
        userProgress,
      };
    });
  }

  async findOne(identifier: string) {
    const course = await this.findCourseEntity(identifier);

    return {
      id: course.id,
      slug: course.slug,
      name: course.name,
      description: course.description,
      languageCode: course.languageCode,
      localeCode: course.localeCode,
      level: course.level.toLowerCase(),
      supportedLayouts: course.supportedLayouts,
      curriculumVersion: course.curriculumVersion,
      estimatedMinutes: course.estimatedMinutes,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      lessons: course.courseLessons.map((cl) => ({
        id: cl.lesson.id,
        slug: cl.lesson.slug,
        title: cl.lesson.title,
        content: cl.lesson.content,
        order: cl.order,
        moduleSlug: cl.moduleSlug,
        moduleTitle: cl.moduleTitle,
        moduleDescription: cl.moduleDescription,
        moduleOrder: cl.moduleOrder,
      })),
      lessonsCount: course.courseLessons.length,
    };
  }

  async update(identifier: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.findCourseEntity(identifier);
    const slug =
      updateCourseDto.name && updateCourseDto.name !== course.name
        ? await this.generateCourseSlug(updateCourseDto.name, course.id)
        : undefined;

    return this.prisma.course.update({
      where: { id: course.id },
      data: {
        ...updateCourseDto,
        ...(slug ? { slug } : {}),
      },
    });
  }

  async remove(identifier: string) {
    const course = await this.findCourseEntity(identifier);
    return this.prisma.course.delete({
      where: { id: course.id },
    });
  }
}
