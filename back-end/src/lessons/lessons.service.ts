// src/lessons/lessons.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LanguageCode, LessonProgressStatus } from '@prisma/client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

import { buildUniqueSlug, isUuid } from '../common/utils/slug.utils';
import { ErrorTrackingService } from '../errors/error-tracking.service';
import { ProgressService } from '../progress/progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { SUPPORTED_LAYOUT_IDS } from '../practice/keyboard-layout-catalog';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { TelemetryService } from '../practice/telemetry.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { SubmitLessonErrorsDto } from './dto/submit-lesson-errors.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private errorTracking: ErrorTrackingService,
    private progressService: ProgressService,
    private telemetryService: TelemetryService,
    @InjectMetric('typing_lessons_completed_total')
    private readonly lessonsCompletedCounter: Counter,
  ) {}

  private getLessonSlugSource(data: {
    title?: string | null;
    description?: string | null;
    content?: string | null;
  }) {
    return data.title?.trim() || data.description?.trim() || data.content?.trim() || 'lesson';
  }

  private async generateLessonSlug(
    data: { title?: string | null; description?: string | null; content?: string | null },
    excludeId?: string,
  ) {
    return buildUniqueSlug(
      this.getLessonSlugSource(data),
      async (slug) => {
        const existing = await this.prisma.lesson.findUnique({
          where: { slug },
          select: { id: true },
        });

        return Boolean(existing && existing.id !== excludeId);
      },
      'lesson',
    );
  }

  private async findCourseByIdentifier(identifier: string) {
    const course = await this.prisma.course.findFirst({
      where: isUuid(identifier)
        ? { OR: [{ id: identifier }, { slug: identifier }] }
        : { slug: identifier },
      select: { id: true, slug: true, name: true, languageCode: true },
    });

    if (!course) {
      throw new NotFoundException(`Curso "${identifier}" no encontrado`);
    }

    return course;
  }

  private async findLessonEntity(identifier: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: isUuid(identifier)
        ? { OR: [{ id: identifier }, { slug: identifier }] }
        : { slug: identifier },
      include: {
        courseLessons: {
          include: { course: { select: { id: true, slug: true, name: true, languageCode: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lección "${identifier}" no encontrada`);
    }

    return lesson;
  }

  // ---------------------
  // Operaciones anidadas (requieren courseId)
  // ---------------------

  async findAllByCourse(courseIdentifier: string, userId?: string | null) {
    const course = await this.findCourseByIdentifier(courseIdentifier);
    const courseId = course.id;

    const courseLessons = await this.prisma.courseLesson.findMany({
      where: { courseId },
      include: { lesson: true },
      orderBy: { order: 'asc' },
    });

    if (!userId) {
      return courseLessons.map((cl) => ({
        id: cl.lesson.id,
        slug: cl.lesson.slug,
        courseSlug: course.slug,
        order: cl.order,
        moduleSlug: cl.moduleSlug,
        moduleTitle: cl.moduleTitle,
        moduleDescription: cl.moduleDescription,
        moduleOrder: cl.moduleOrder,
        required: cl.required,
        type: cl.lesson.type,
        title: cl.lesson.title,
        content: cl.lesson.content,
        description: cl.lesson.description,
        objective: cl.lesson.objective,
        instructions: cl.lesson.instructions,
        fingerPositions: cl.lesson.fingerPositions,
        targetKeys: cl.lesson.targetKeys,
        focusKeys: cl.lesson.focusKeys,
        reviewKeys: cl.lesson.reviewKeys,
        allowedCharacters: cl.lesson.allowedCharacters,
        difficulty: cl.lesson.difficulty,
        estimatedSeconds: cl.lesson.estimatedSeconds,
        minAccuracy: cl.lesson.minAccuracy,
        maxTargetKeyErrors: cl.lesson.maxTargetKeyErrors,
        requiredSuccessfulAttempts: cl.lesson.requiredSuccessfulAttempts,
        hideLiveWpm: cl.lesson.hideLiveWpm,
        mediaUrl: cl.lesson.mediaUrl,
        audioUrl: cl.lesson.audioUrl,
        createdAt: cl.lesson.createdAt,
        updatedAt: cl.lesson.updatedAt,
        isLocked: false,
        userProgress: null,
      }));
    }

    const lessonIds = courseLessons.map((cl) => cl.lesson.id);
    const userProgressList = await this.prisma.userLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });

    const progressMap = new Map();
    userProgressList.forEach((p) => progressMap.set(p.lessonId, p));

    return courseLessons.map((cl, index) => {
      const progress = progressMap.get(cl.lesson.id);
      const previousLesson = index > 0 ? courseLessons[index - 1] : null;
      const previousProgress = previousLesson ? progressMap.get(previousLesson.lesson.id) : null;
      const previousCompleted =
        !previousLesson ||
        !previousLesson.required ||
        previousProgress?.status === LessonProgressStatus.MASTERED ||
        previousProgress?.status === LessonProgressStatus.COMPLETED;

      return {
        id: cl.lesson.id,
        slug: cl.lesson.slug,
        courseSlug: course.slug,
        order: cl.order,
        moduleSlug: cl.moduleSlug,
        moduleTitle: cl.moduleTitle,
        moduleDescription: cl.moduleDescription,
        moduleOrder: cl.moduleOrder,
        required: cl.required,
        type: cl.lesson.type,
        title: cl.lesson.title,
        content: cl.lesson.content,
        description: cl.lesson.description,
        objective: cl.lesson.objective,
        instructions: cl.lesson.instructions,
        fingerPositions: cl.lesson.fingerPositions,
        targetKeys: cl.lesson.targetKeys,
        focusKeys: cl.lesson.focusKeys,
        reviewKeys: cl.lesson.reviewKeys,
        allowedCharacters: cl.lesson.allowedCharacters,
        difficulty: cl.lesson.difficulty,
        estimatedSeconds: cl.lesson.estimatedSeconds,
        minAccuracy: cl.lesson.minAccuracy,
        maxTargetKeyErrors: cl.lesson.maxTargetKeyErrors,
        requiredSuccessfulAttempts: cl.lesson.requiredSuccessfulAttempts,
        hideLiveWpm: cl.lesson.hideLiveWpm,
        mediaUrl: cl.lesson.mediaUrl,
        audioUrl: cl.lesson.audioUrl,
        createdAt: cl.lesson.createdAt,
        updatedAt: cl.lesson.updatedAt,
        isLocked: !previousCompleted,
        userProgress: progress
          ? {
              completed:
                progress.status === LessonProgressStatus.COMPLETED ||
                progress.status === LessonProgressStatus.MASTERED,
              mastered: progress.status === LessonProgressStatus.MASTERED,
              status: progress.status,
              attemptsCount: progress.attemptsCount,
              successfulAttempts: progress.successfulAttempts,
              bestWpm: progress.bestQualifiedNetWpm,
              bestScore: progress.bestScore,
              bestAccuracy: progress.bestAccuracy,
              timeSpent: progress.timeElapsed,
            }
          : null,
      };
    });
  }

  async create(courseIdentifier: string, dto: CreateLessonDto) {
    const course = await this.findCourseByIdentifier(courseIdentifier);
    const courseId = course.id;

    const existingOrder = await this.prisma.courseLesson.findUnique({
      where: { courseId_order: { courseId, order: dto.order } },
    });
    if (existingOrder) {
      throw new ConflictException(
        `Ya existe una lección en la posición ${dto.order} en este curso`,
      );
    }

    const slug = await this.generateLessonSlug(dto);

    const lesson = await this.prisma.lesson.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        type: dto.type,
        description: dto.description,
        objective: dto.objective,
        instructions: dto.instructions,
        fingerPositions: dto.fingerPositions ?? undefined,
        targetKeys: dto.targetKeys ?? undefined,
        focusKeys: dto.focusKeys,
        reviewKeys: dto.reviewKeys,
        allowedCharacters: dto.allowedCharacters,
        difficulty: dto.difficulty,
        estimatedSeconds: dto.estimatedSeconds,
        minAccuracy: dto.minAccuracy,
        maxTargetKeyErrors: dto.maxTargetKeyErrors,
        requiredSuccessfulAttempts: dto.requiredSuccessfulAttempts,
        hideLiveWpm: dto.hideLiveWpm,
        mediaUrl: dto.mediaUrl,
        audioUrl: dto.audioUrl,
      },
    });

    await this.prisma.courseLesson.create({
      data: { courseId, lessonId: lesson.id, order: dto.order },
    });

    return lesson;
  }

  async addLessonToCourse(courseIdentifier: string, lessonIdentifier: string, order?: number) {
    const course = await this.findCourseByIdentifier(courseIdentifier);
    const courseId = course.id;

    const lesson = await this.findLessonEntity(lessonIdentifier);
    const lessonId = lesson.id;

    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrderResult = await this.prisma.courseLesson.aggregate({
        where: { courseId },
        _max: { order: true },
      });
      finalOrder = (maxOrderResult._max.order ?? 0) + 1;
    }

    if (order !== undefined) {
      const existingOrder = await this.prisma.courseLesson.findUnique({
        where: { courseId_order: { courseId, order: finalOrder } },
      });
      if (existingOrder) {
        throw new ConflictException(`Ya existe una lección en la posición ${order} en este curso`);
      }
    }

    const existingAssociation = await this.prisma.courseLesson.findUnique({
      where: { courseId_lessonId: { courseId, lessonId } },
    });
    if (existingAssociation) {
      throw new ConflictException(`La lección ya está asociada a este curso`);
    }

    const courseLesson = await this.prisma.courseLesson.create({
      data: { courseId, lessonId, order: finalOrder },
      include: { lesson: true },
    });

    return {
      id: courseLesson.id,
      order: courseLesson.order,
      lesson: {
        id: courseLesson.lesson.id,
        slug: courseLesson.lesson.slug,
        type: courseLesson.lesson.type,
        title: courseLesson.lesson.title,
        content: courseLesson.lesson.content,
        description: courseLesson.lesson.description,
        objective: courseLesson.lesson.objective,
        instructions: courseLesson.lesson.instructions,
        fingerPositions: courseLesson.lesson.fingerPositions,
        targetKeys: courseLesson.lesson.targetKeys,
        focusKeys: courseLesson.lesson.focusKeys,
        reviewKeys: courseLesson.lesson.reviewKeys,
        allowedCharacters: courseLesson.lesson.allowedCharacters,
        difficulty: courseLesson.lesson.difficulty,
        estimatedSeconds: courseLesson.lesson.estimatedSeconds,
        minAccuracy: courseLesson.lesson.minAccuracy,
        maxTargetKeyErrors: courseLesson.lesson.maxTargetKeyErrors,
        requiredSuccessfulAttempts: courseLesson.lesson.requiredSuccessfulAttempts,
        hideLiveWpm: courseLesson.lesson.hideLiveWpm,
        mediaUrl: courseLesson.lesson.mediaUrl,
        audioUrl: courseLesson.lesson.audioUrl,
      },
    };
  }

  async removeLessonFromCourse(courseIdentifier: string, lessonIdentifier: string) {
    const course = await this.findCourseByIdentifier(courseIdentifier);
    const lesson = await this.findLessonEntity(lessonIdentifier);

    const association = await this.prisma.courseLesson.findUnique({
      where: { courseId_lessonId: { courseId: course.id, lessonId: lesson.id } },
    });
    if (!association) throw new NotFoundException(`La lección no está asociada a este curso`);

    await this.prisma.courseLesson.delete({ where: { id: association.id } });
    return { message: 'Lección desasociada del curso' };
  }

  // ---------------------
  // Operaciones planas (usando solo lessonId)
  // ---------------------

  async findOne(identifier: string) {
    const lesson = await this.findLessonEntity(identifier);

    const courses = lesson.courseLessons.map((cl) => ({
      id: cl.course.id,
      slug: cl.course.slug,
      name: cl.course.name,
      languageCode: cl.course.languageCode,
      order: cl.order,
    }));

    return {
      id: lesson.id,
      slug: lesson.slug,
      type: lesson.type,
      title: lesson.title,
      content: lesson.content,
      description: lesson.description,
      objective: lesson.objective,
      instructions: lesson.instructions,
      fingerPositions: lesson.fingerPositions,
      targetKeys: lesson.targetKeys,
      focusKeys: lesson.focusKeys,
      reviewKeys: lesson.reviewKeys,
      allowedCharacters: lesson.allowedCharacters,
      difficulty: lesson.difficulty,
      estimatedSeconds: lesson.estimatedSeconds,
      minAccuracy: lesson.minAccuracy,
      maxTargetKeyErrors: lesson.maxTargetKeyErrors,
      requiredSuccessfulAttempts: lesson.requiredSuccessfulAttempts,
      hideLiveWpm: lesson.hideLiveWpm,
      mediaUrl: lesson.mediaUrl,
      audioUrl: lesson.audioUrl,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      courses,
    };
  }

  async update(identifier: string, dto: UpdateLessonDto) {
    const lesson = await this.findLessonEntity(identifier);
    const slug =
      dto.title !== undefined || dto.description !== undefined || dto.content !== undefined
        ? await this.generateLessonSlug(
            {
              title: dto.title ?? lesson.title,
              description: dto.description ?? lesson.description,
              content: dto.content ?? lesson.content,
            },
            lesson.id,
          )
        : undefined;

    return this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        title: dto.title,
        ...(slug ? { slug } : {}),
        content: dto.content,
        type: dto.type,
        description: dto.description,
        objective: dto.objective,
        instructions: dto.instructions,
        fingerPositions: dto.fingerPositions ?? undefined,
        targetKeys: dto.targetKeys ?? undefined,
        focusKeys: dto.focusKeys,
        reviewKeys: dto.reviewKeys,
        allowedCharacters: dto.allowedCharacters,
        difficulty: dto.difficulty,
        estimatedSeconds: dto.estimatedSeconds,
        minAccuracy: dto.minAccuracy,
        maxTargetKeyErrors: dto.maxTargetKeyErrors,
        requiredSuccessfulAttempts: dto.requiredSuccessfulAttempts,
        hideLiveWpm: dto.hideLiveWpm,
        mediaUrl: dto.mediaUrl,
        audioUrl: dto.audioUrl,
      },
    });
  }

  async remove(identifier: string) {
    const lesson = await this.findLessonEntity(identifier);
    await this.prisma.courseLesson.deleteMany({ where: { lessonId: lesson.id } });
    await this.prisma.lesson.delete({ where: { id: lesson.id } });
    return { id: lesson.id };
  }

  async saveProgress(userId: string, lessonIdentifier: string, dto: CompleteLessonDto): Promise<any> {
    const lesson = await this.findLessonEntity(lessonIdentifier);
    const lessonId = lesson.id;
    const localeCode = dto.locale ?? 'es-latam';

    if (dto.completed === true) {
      if (lesson.type !== 'explanatory') {
        throw new BadRequestException(
          'El campo "completed" solo es válido para lecciones explicativas',
        );
      }

      const existing = await this.prisma.userLessonProgress.findUnique({
        where: { userId_lessonId_localeCode: { userId, lessonId, localeCode } },
      });
      const completedAt = new Date();
      const progress = await this.prisma.userLessonProgress.upsert({
        where: { userId_lessonId_localeCode: { userId, lessonId, localeCode } },
        update: {
          status: LessonProgressStatus.COMPLETED,
          successfulAttempts: 1,
          achievedAt: completedAt,
        },
        create: {
          userId,
          lessonId,
          localeCode,
          bestNetWpm: 0,
          bestGrossWpm: 0,
          bestAccuracy: 0,
          timeElapsed: 0,
          bestScore: 0,
          achievedAt: completedAt,
          status: LessonProgressStatus.COMPLETED,
          successfulAttempts: 1,
        },
      });

      if (!existing) this.lessonsCompletedCounter.inc();

      return {
        ...progress,
        qualified: true,
        mastered: false,
        recommendation: 'continue',
      };
    }

    if (
      dto.netWpm === undefined ||
      dto.grossWpm === undefined ||
      dto.accuracy === undefined ||
      dto.timeElapsed === undefined
    ) {
      throw new BadRequestException('Las métricas son obligatorias para lecciones de práctica');
    }

    if (lesson.type !== 'practice') {
      throw new BadRequestException('Las métricas solo son válidas para lecciones de práctica');
    }

    if (
      !dto.errorSummary ||
      dto.errorSummary.totalKeystrokes < 1 ||
      dto.errorSummary.keys.length === 0
    ) {
      throw new BadRequestException('errorSummary es obligatorio para lecciones de práctica');
    }

    const targetKeyRequirementMet =
      lesson.maxTargetKeyErrors === null ||
      lesson.maxTargetKeyErrors === undefined ||
      (dto.targetKeyErrors !== undefined && dto.targetKeyErrors <= lesson.maxTargetKeyErrors);
    const qualified = dto.accuracy >= lesson.minAccuracy && targetKeyRequirementMet;
    const now = new Date();
    const languageCode = lesson.courseLessons[0]?.course.languageCode;
    if (!languageCode) {
      throw new BadRequestException('La lección no tiene un curso asociado con idioma');
    }
    if (dto.layoutId && !SUPPORTED_LAYOUT_IDS.has(dto.layoutId)) {
      throw new BadRequestException('layoutId no soportado');
    }
    const derived = dto.telemetry ? this.telemetryService.derive(dto.telemetry) : null;
    const errorSummary = derived
      ? {
          totalKeystrokes: derived.totalFinalInputs,
          totalErrors: derived.uncorrectedErrors,
          keys: Array.from(derived.keyStats.entries()).map(([expected, value]) => ({
            expected,
            totalPresses: value.presses,
            totalErrors: value.errors,
          })),
        }
      : dto.errorSummary!;

    const result = await this.prisma.$transaction(async (tx) => {
      const duplicate = dto.clientSessionId
        ? await tx.lessonAttempt.findUnique({
            where: { userId_clientSessionId: { userId, clientSessionId: dto.clientSessionId } },
          })
        : null;
      if (duplicate) return { duplicate: true };
      const existing = await tx.userLessonProgress.findUnique({
        where: { userId_lessonId_localeCode: { userId, lessonId, localeCode } },
      });

      await tx.lessonAttempt.create({
        data: {
          userId,
          lessonId,
          netWpm: dto.netWpm!,
          grossWpm: dto.grossWpm!,
          accuracy: dto.accuracy!,
          timeElapsed: dto.timeElapsed!,
          qualified,
          usedAssistance: dto.usedAssistance ?? false,
          clientSessionId: dto.clientSessionId,
        },
      });

      const successfulAttempts = (existing?.successfulAttempts ?? 0) + (qualified ? 1 : 0);
      const mastered = qualified || existing?.status === LessonProgressStatus.MASTERED;
      const status = mastered ? LessonProgressStatus.MASTERED : LessonProgressStatus.IN_PROGRESS;
      const improvesQualifiedWpm = qualified && dto.netWpm! > (existing?.bestQualifiedNetWpm ?? 0);
      const bestQualifiedNetWpm = improvesQualifiedWpm
        ? dto.netWpm!
        : (existing?.bestQualifiedNetWpm ?? 0);
      const bestGrossWpm = improvesQualifiedWpm ? dto.grossWpm! : (existing?.bestGrossWpm ?? 0);
      const bestAccuracy = qualified
        ? Math.max(existing?.bestAccuracy ?? 0, dto.accuracy!)
        : (existing?.bestAccuracy ?? 0);
      const nextReviewAt = null;

      const progress = await tx.userLessonProgress.upsert({
        where: { userId_lessonId_localeCode: { userId, lessonId, localeCode } },
        update: {
          status,
          attemptsCount: { increment: 1 },
          successfulAttempts,
          latestNetWpm: dto.netWpm!,
          latestAccuracy: dto.accuracy!,
          bestNetWpm: bestQualifiedNetWpm,
          bestGrossWpm,
          bestAccuracy,
          timeElapsed: improvesQualifiedWpm ? dto.timeElapsed! : (existing?.timeElapsed ?? 0),
          bestScore: bestQualifiedNetWpm * 100,
          bestQualifiedNetWpm,
          achievedAt: improvesQualifiedWpm ? now : (existing?.achievedAt ?? now),
          masteredAt: mastered ? (existing?.masteredAt ?? now) : null,
          nextReviewAt,
        },
        create: {
          userId,
          lessonId,
          localeCode,
          bestNetWpm: qualified ? dto.netWpm! : 0,
          bestGrossWpm: qualified ? dto.grossWpm! : 0,
          bestAccuracy: qualified ? dto.accuracy! : 0,
          timeElapsed: qualified ? dto.timeElapsed! : 0,
          bestScore: qualified ? dto.netWpm! * 100 : 0,
          achievedAt: now,
          status,
          attemptsCount: 1,
          successfulAttempts,
          latestNetWpm: dto.netWpm!,
          latestAccuracy: dto.accuracy!,
          bestQualifiedNetWpm: qualified ? dto.netWpm! : 0,
          masteredAt: mastered ? now : null,
          nextReviewAt,
        },
      });

      await this.errorTracking.processLessonErrorsInTransaction(tx, userId, lesson.id, {
        netWpm: dto.netWpm!,
        grossWpm: dto.grossWpm!,
        accuracy: dto.accuracy!,
        timeElapsed: dto.timeElapsed!,
        languageCode,
        localeCode,
        errorSummary,
      });

      if (dto.layoutId) {
        await this.errorTracking.processLessonLayoutStatsInTransaction(
          tx,
          userId,
          languageCode,
          dto.layoutId,
          errorSummary,
        );
      }

      await this.progressService.recordPracticeTimeInTransaction(
        tx,
        userId,
        dto.timeElapsed!,
        now,
        localeCode,
      );

      return {
        progress,
        mastered,
        becameMastered: mastered && existing?.status !== LessonProgressStatus.MASTERED,
      };
    });

    if ('duplicate' in result) return { result: 'duplicate' };

    if (result.becameMastered) this.lessonsCompletedCounter.inc();

    return {
      ...result.progress,
      qualified,
      mastered: result.mastered,
      minAccuracy: lesson.minAccuracy,
      recommendation: result.mastered ? 'continue' : 'review',
    };
  }

  async submitErrors(
    userId: string,
    lessonIdentifier: string,
    dto: SubmitLessonErrorsDto,
    userLanguage: LanguageCode,
  ) {
    const lesson = await this.findLessonEntity(lessonIdentifier);
    const errorSummary = this.errorTracking.createSummaryFromKeystrokes(
      dto.keystrokes.map((k) => ({
        key: k.key,
        expected: k.expected,
        correct: k.correct,
      })),
    );

    await this.errorTracking.processLessonErrors(userId, lesson.id, {
      netWpm: dto.netWpm,
      grossWpm: dto.grossWpm,
      accuracy: dto.accuracy,
      timeElapsed: dto.timeElapsed,
      languageCode: userLanguage,
      localeCode: 'es-latam',
      errorSummary,
    });

    return { saved: true, totalKeystrokes: errorSummary.totalKeystrokes };
  }
}
