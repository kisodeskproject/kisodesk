import { SUPPORTED_LOCALES, type Locale } from './locales';
import { getServerApiBaseUrl } from './serverApi';

export type PublicCourse = {
  slug: string;
  name: string;
  description: string;
  languageCode: string;
  localeCode: Locale;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessonsCount: number;
  supportedLayouts: string[];
  estimatedMinutes: number | null;
};

export type PublicLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  objective: string;
  order: number;
  moduleSlug: string;
  moduleTitle: string;
  moduleDescription: string;
  moduleOrder: number;
};

type RawCourse = {
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  languageCode?: unknown;
  localeCode?: unknown;
  level?: unknown;
  lessonsCount?: unknown;
  supportedLayouts?: unknown;
  estimatedMinutes?: unknown;
};

type RawLesson = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  objective?: unknown;
  order?: unknown;
  moduleSlug?: unknown;
  moduleTitle?: unknown;
  moduleDescription?: unknown;
  moduleOrder?: unknown;
};

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function toLevel(value: unknown): PublicCourse['level'] {
  return value === 'intermediate' || value === 'advanced' ? value : 'beginner';
}

function toPublicCourse(value: RawCourse): PublicCourse | null {
  if (
    typeof value.slug !== 'string' ||
    !value.slug.trim() ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !isLocale(value.localeCode)
  ) {
    return null;
  }

  return {
    slug: value.slug,
    name: value.name,
    description: typeof value.description === 'string' ? value.description : '',
    languageCode: typeof value.languageCode === 'string' ? value.languageCode : value.localeCode,
    localeCode: value.localeCode,
    level: toLevel(value.level),
    lessonsCount: typeof value.lessonsCount === 'number' ? value.lessonsCount : 0,
    supportedLayouts: Array.isArray(value.supportedLayouts)
      ? value.supportedLayouts.filter((layout): layout is string => typeof layout === 'string')
      : [],
    estimatedMinutes: typeof value.estimatedMinutes === 'number' ? value.estimatedMinutes : null,
  };
}

function toPublicLesson(value: RawLesson): PublicLesson | null {
  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.slug !== 'string' ||
    !value.slug.trim() ||
    typeof value.title !== 'string' ||
    !value.title.trim()
  ) {
    return null;
  }

  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : '',
    objective: typeof value.objective === 'string' ? value.objective : '',
    order: typeof value.order === 'number' ? value.order : 0,
    moduleSlug: typeof value.moduleSlug === 'string' ? value.moduleSlug : 'course',
    moduleTitle: typeof value.moduleTitle === 'string' ? value.moduleTitle : '',
    moduleDescription: typeof value.moduleDescription === 'string' ? value.moduleDescription : '',
    moduleOrder: typeof value.moduleOrder === 'number' ? value.moduleOrder : 0,
  };
}

export async function getPublicCourses(locale: Locale): Promise<PublicCourse[]> {
  const courses = await getAllPublicCourses();
  return courses.filter((course) => course.localeCode === locale);
}

export async function getPublicCourseBySlug(courseSlug: string): Promise<PublicCourse | null> {
  return (await getAllPublicCourses()).find((course) => course.slug === courseSlug) ?? null;
}

async function getAllPublicCourses(): Promise<PublicCourse[]> {
  try {
    const response = await fetch(`${getServerApiBaseUrl()}/courses`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];

    const body = (await response.json()) as RawCourse[] | { courses?: RawCourse[] };
    const courses = Array.isArray(body) ? body : body.courses;
    if (!Array.isArray(courses)) return [];

    return courses.map(toPublicCourse).filter((course): course is PublicCourse => course !== null);
  } catch {
    return [];
  }
}

export async function getPublicCourseListing(
  locale: Locale,
  courseSlug: string,
): Promise<{ course: PublicCourse; lessons: PublicLesson[] } | null> {
  const course = (await getPublicCourses(locale)).find((item) => item.slug === courseSlug);
  if (!course) return null;

  try {
    const response = await fetch(`${getServerApiBaseUrl()}/courses/${encodeURIComponent(course.slug)}/lessons`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return { course, lessons: [] };

    const body = (await response.json()) as RawLesson[] | { lessons?: RawLesson[] };
    const items = Array.isArray(body) ? body : body.lessons;
    if (!Array.isArray(items)) return { course, lessons: [] };

    return {
      course,
      lessons: items
        .map(toPublicLesson)
        .filter((lesson): lesson is PublicLesson => lesson !== null)
        .sort((a, b) => a.order - b.order),
    };
  } catch {
    return { course, lessons: [] };
  }
}
