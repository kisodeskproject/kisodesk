// front-typing/app/[lang]/public/courses/[courseId]/lessons/[lessonId]/page.tsx

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import LessonPracticePage from '@/app/[lang]/dashboard/courses/[courseId]/lessons/[lessonId]/page';
import JsonLd from '@/components/seo/JsonLd';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';
import { getPublicCourseBySlug, getPublicCourseListing } from '@/lib/publicCourses';
import { buildLearningResourceJsonLd } from '@/lib/structuredData';

interface LessonPracticePageProps {
  params: Promise<{
    lang: string;
    courseId: string;
    lessonId: string;
  }>;
}

export async function generateMetadata({ params }: LessonPracticePageProps): Promise<Metadata> {
  const { lang, courseId, lessonId } = await params;
  const locale = toSupportedLocale(lang);

  return localizedMetadata(
    lang,
    `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    {
      [locale]: {
        title: getTranslation(locale, 'public.courses.lessons.lesson.metadata.title'),
        description: getTranslation(locale, 'public.courses.lessons.lesson.metadata.description'),
      },
    },
  );
}

export default async function Page({ params }: LessonPracticePageProps) {
  const { lang, courseId, lessonId } = await params;
  const locale = toSupportedLocale(lang);
  const course = await getPublicCourseBySlug(courseId);

  if (course && course.localeCode !== locale) {
    redirect(
      `/${course.localeCode}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    );
  }

  const listing = await getPublicCourseListing(locale, courseId);
  const lesson = listing?.lessons.find((item) => item.slug === lessonId);

  return (
    <>
      {listing && lesson && <JsonLd data={buildLearningResourceJsonLd(locale, listing.course, lesson)} />}
      <LessonPracticePage />
    </>
  );
}
