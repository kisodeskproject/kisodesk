import { CoursesService } from './courses.service';

describe('CoursesService progress aggregation', () => {
  it('cuenta solo lecciones completadas o dominadas en el progreso del curso', async () => {
    const prisma = {
      course: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'course-1',
            slug: 'curso-1',
            name: 'Curso 1',
            description: null,
            languageCode: 'es',
            level: 'BEGINNER',
            supportedLayouts: [],
            curriculumVersion: 1,
            estimatedMinutes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { courseLessons: 2 },
          },
        ]),
      },
      courseLesson: {
        findMany: jest.fn().mockResolvedValue([
          { courseId: 'course-1', lessonId: 'lesson-started', lesson: { type: 'practice' } },
          { courseId: 'course-1', lessonId: 'lesson-mastered', lesson: { type: 'practice' } },
        ]),
      },
      userLessonProgress: {
        findMany: jest.fn().mockResolvedValue([
          {
            lessonId: 'lesson-started',
            status: 'IN_PROGRESS',
            bestQualifiedNetWpm: 0,
            bestAccuracy: 0,
            timeElapsed: 0,
          },
          {
            lessonId: 'lesson-mastered',
            status: 'MASTERED',
            bestQualifiedNetWpm: 42,
            bestAccuracy: 97,
            timeElapsed: 60,
          },
        ]),
      },
    };
    const service = new CoursesService(prisma as any);

    const [course] = await service.findAll('user-1');

    expect(course.userProgress).toEqual(
      expect.objectContaining({
        completedLessons: 1,
        masteredLessons: 1,
        bestWpm: 42,
        totalTimeSpent: 60,
      }),
    );
  });
});
