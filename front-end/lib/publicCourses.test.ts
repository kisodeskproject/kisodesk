import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getPublicCourseListing, getPublicCourses } from './publicCourses';

describe('getPublicCourses', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    Object.defineProperty(global, 'fetch', { configurable: true, value: fetchMock, writable: true });
  });

  afterEach(() => {
    fetchMock.mockReset();
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it('returns only complete courses for the requested canonical locale', async () => {
    fetchMock.mockResolvedValue({
      json: async () => [
        {
          slug: 'english-typing-course',
          name: 'English Typing Course',
          description: 'Learn touch typing.',
          localeCode: 'en-US',
          languageCode: 'en',
          level: 'beginner',
          lessonsCount: 12,
          supportedLayouts: ['QWERTY_US'],
          estimatedMinutes: 60,
        },
        { slug: 'alias-course', name: 'Alias', localeCode: 'en', level: 'beginner' },
        { slug: 'spanish-course', name: 'Spanish', localeCode: 'es-latam', level: 'advanced' },
      ],
      ok: true,
    });

    await expect(getPublicCourses('en-US')).resolves.toEqual([
      {
        slug: 'english-typing-course',
        name: 'English Typing Course',
        description: 'Learn touch typing.',
        localeCode: 'en-US',
        languageCode: 'en',
        level: 'beginner',
        lessonsCount: 12,
        supportedLayouts: ['QWERTY_US'],
        estimatedMinutes: 60,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/courses',
      expect.objectContaining({ next: { revalidate: 3600 } }),
    );
  });

  it('returns the public lessons for the exact course and locale', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            slug: 'english-typing-course',
            name: 'English Typing Course',
            description: 'Learn touch typing.',
            localeCode: 'en-US',
            languageCode: 'en',
            level: 'beginner',
            lessonsCount: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'lesson-1',
            slug: 'home-row',
            title: 'Home row',
            description: 'Place your fingers.',
            objective: 'Learn the home row.',
            order: 1,
            moduleSlug: 'basics',
            moduleTitle: 'Basics',
            moduleOrder: 1,
          },
        ],
      });

    await expect(getPublicCourseListing('en-US', 'english-typing-course')).resolves.toEqual({
      course: expect.objectContaining({ slug: 'english-typing-course', localeCode: 'en-US' }),
      lessons: [expect.objectContaining({ slug: 'home-row', objective: 'Learn the home row.' })],
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:3000/v1/courses/english-typing-course/lessons',
      expect.objectContaining({ next: { revalidate: 3600 } }),
    );
  });
});
