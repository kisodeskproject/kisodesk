// front-typing/app/[lang]/public/courses/[courseId]/lessons/page.tsx

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import PublicCourseLessonsContent from '@/components/seo/PublicCourseLessonsContent';
import { localizedMetadata } from '@/lib/seo';
import { getTranslation } from '@/lib/i18n';
import { toSupportedLocale } from '@/lib/locales';
import { getPublicCourseBySlug, getPublicCourseListing } from '@/lib/publicCourses';

export const revalidate = 3600;

interface CourseLessonsPageProps {
  params: Promise<{
    lang: string;
    courseId: string;
  }>;
}

export async function generateMetadata({ params }: CourseLessonsPageProps): Promise<Metadata> {
  const { lang, courseId } = await params;
  const locale = toSupportedLocale(lang);
  const course = await getPublicCourseBySlug(courseId);

  if (course && course.localeCode !== locale) {
    redirect(`/${course.localeCode}/courses/${encodeURIComponent(courseId)}/lessons`);
  }

  const listing = await getPublicCourseListing(locale, courseId);

  return localizedMetadata(lang, `/courses/${encodeURIComponent(courseId)}/lessons`, {
    [locale]: {
      title: listing
        ? `${listing.course.name} · ${getTranslation(locale, 'lessons.general.title')}`
        : getTranslation(locale, 'public.courses.lessons.metadata.title'),
      description: listing?.course.description ?? getTranslation(locale, 'public.courses.lessons.metadata.description'),
    },
  });
}

export default async function Page({ params }: CourseLessonsPageProps) {
  const { lang, courseId } = await params;
  const locale = toSupportedLocale(lang);
  const listing = await getPublicCourseListing(locale, courseId);

  if (!listing) notFound();

  return <PublicCourseLessonsContent locale={locale} course={listing.course} lessons={listing.lessons} />;
}
