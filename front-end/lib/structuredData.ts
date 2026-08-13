import type { Locale } from './locales';
import type { PublicCourse, PublicLesson } from './publicCourses';
import { siteUrl } from './seo';

const provider = {
  '@type': 'Organization',
  name: 'KisoDesk',
  url: siteUrl,
} as const;

function courseUrl(locale: Locale, courseSlug: string) {
  return `${siteUrl}/${locale}/courses/${encodeURIComponent(courseSlug)}/lessons`;
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function buildWebApplicationJsonLd(locale: Locale, description: string) {
  const url = `${siteUrl}/${locale}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${url}#web-application`,
    name: 'KisoDesk',
    url,
    description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: locale === 'es-latam' ? 'es-419' : locale,
    isAccessibleForFree: true,
  };
}

export function buildCourseJsonLd(
  locale: Locale,
  course: PublicCourse,
  teaches: string[] = [],
  includeContext = true,
) {
  const url = courseUrl(locale, course.slug);
  const learningOutcomes = [...new Set(teaches.map((value) => value.trim()).filter(Boolean))];

  return {
    ...(includeContext ? { '@context': 'https://schema.org' } : {}),
    '@type': 'Course',
    '@id': `${url}#course`,
    name: course.name,
    ...(course.description.trim() ? { description: course.description } : {}),
    url,
    inLanguage: course.languageCode,
    educationalLevel: course.level,
    isAccessibleForFree: true,
    provider,
    ...(learningOutcomes.length ? { teaches: learningOutcomes } : {}),
    // NOTE: price is hardcoded to free. If the pricing/monetization model
    // ever changes, this must be revisited — see docs/seo-pricing-review.md.
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'Free',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      inLanguage: course.languageCode,
    },
  };
}

export function buildFaqPageJsonLd(url: string, faq: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

export function buildLearningResourceJsonLd(
  locale: Locale,
  course: PublicCourse,
  lesson: PublicLesson,
) {
  const parentCourseUrl = courseUrl(locale, course.slug);
  const url = `${parentCourseUrl}/${encodeURIComponent(lesson.slug)}`;
  const description = lesson.description.trim() || lesson.objective.trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${url}#learning-resource`,
    name: lesson.title,
    ...(description ? { description } : {}),
    url,
    inLanguage: course.languageCode,
    educationalLevel: course.level,
    learningResourceType: 'Interactive exercise',
    isAccessibleForFree: true,
    isPartOf: {
      '@id': `${parentCourseUrl}#course`,
      '@type': 'Course',
      name: course.name,
    },
    ...(lesson.objective.trim() ? { teaches: lesson.objective } : {}),
  };
}
