import Link from 'next/link';

import { buildCourseBreadcrumbJsonLd } from '@/lib/courseBreadcrumbs';
import { getTranslation } from '@/lib/i18n';
import { CONTENT_LANGUAGE_OPTIONS, type Locale } from '@/lib/locales';
import type { PublicCourse, PublicLesson } from '@/lib/publicCourses';
import { LESSON_LABELS } from '@/lib/publicCitationContent';

type Labels = {
  language: string;
  objectives: string;
  audience: string;
  requirements: string;
  relatedPractice: string;
};

const LABELS: Record<Locale, Labels> = {
  cs: {
    language: 'Jazyk',
    objectives: 'Cíle učení',
    audience: 'Pro koho je kurz',
    requirements: 'Požadavky',
    relatedPractice: 'Související procvičování',
  },
  da: {
    language: 'Sprog',
    objectives: 'Læringsmål',
    audience: 'Hvem er kurset for',
    requirements: 'Krav',
    relatedPractice: 'Relateret øvelse',
  },
  de: {
    language: 'Sprache',
    objectives: 'Lernziele',
    audience: 'Für wen geeignet',
    requirements: 'Voraussetzungen',
    relatedPractice: 'Passende Übung',
  },
  'en-US': {
    language: 'Language',
    objectives: 'Learning objectives',
    audience: 'Who this course is for',
    requirements: 'Requirements',
    relatedPractice: 'Related practice',
  },
  'en-GB': {
    language: 'Language',
    objectives: 'Learning objectives',
    audience: 'Who this course is for',
    requirements: 'Requirements',
    relatedPractice: 'Related practice',
  },
  'es-ES': {
    language: 'Idioma',
    objectives: 'Objetivos de aprendizaje',
    audience: 'A quién va dirigido',
    requirements: 'Requisitos',
    relatedPractice: 'Práctica relacionada',
  },
  'es-latam': {
    language: 'Idioma',
    objectives: 'Objetivos de aprendizaje',
    audience: 'A quién va dirigido',
    requirements: 'Requisitos',
    relatedPractice: 'Práctica relacionada',
  },
  fr: {
    language: 'Langue',
    objectives: 'Objectifs d’apprentissage',
    audience: 'À qui s’adresse ce cours',
    requirements: 'Prérequis',
    relatedPractice: 'Entraînement associé',
  },
  hr: {
    language: 'Jezik',
    objectives: 'Ciljevi učenja',
    audience: 'Kome je tečaj namijenjen',
    requirements: 'Preduvjeti',
    relatedPractice: 'Povezana vježba',
  },
  hu: {
    language: 'Nyelv',
    objectives: 'Tanulási célok',
    audience: 'Kinek szól a kurzus',
    requirements: 'Követelmények',
    relatedPractice: 'Kapcsolódó gyakorlás',
  },
  it: {
    language: 'Lingua',
    objectives: 'Obiettivi di apprendimento',
    audience: 'A chi è rivolto il corso',
    requirements: 'Requisiti',
    relatedPractice: 'Esercitazione correlata',
  },
  nl: {
    language: 'Taal',
    objectives: 'Leerdoelen',
    audience: 'Voor wie is deze cursus',
    requirements: 'Vereisten',
    relatedPractice: 'Gerelateerde oefening',
  },
  no: {
    language: 'Språk',
    objectives: 'Læringsmål',
    audience: 'Hvem kurset passer for',
    requirements: 'Krav',
    relatedPractice: 'Relevant øvelse',
  },
  pl: {
    language: 'Język',
    objectives: 'Cele nauki',
    audience: 'Dla kogo jest ten kurs',
    requirements: 'Wymagania',
    relatedPractice: 'Powiązane ćwiczenie',
  },
  'pt-BR': {
    language: 'Idioma',
    objectives: 'Objetivos de aprendizagem',
    audience: 'Para quem é este curso',
    requirements: 'Requisitos',
    relatedPractice: 'Prática relacionada',
  },
  'pt-PT': {
    language: 'Idioma',
    objectives: 'Objetivos de aprendizagem',
    audience: 'A quem se destina este curso',
    requirements: 'Requisitos',
    relatedPractice: 'Prática relacionada',
  },
  ro: {
    language: 'Limbă',
    objectives: 'Obiective de învățare',
    audience: 'Pentru cine este cursul',
    requirements: 'Cerințe',
    relatedPractice: 'Exercițiu asociat',
  },
  sv: {
    language: 'Språk',
    objectives: 'Lärandemål',
    audience: 'Vem kursen passar för',
    requirements: 'Krav',
    relatedPractice: 'Relaterad övning',
  },
  tr: {
    language: 'Dil',
    objectives: 'Öğrenme hedefleri',
    audience: 'Bu kurs kimler için',
    requirements: 'Gereksinimler',
    relatedPractice: 'İlgili alıştırma',
  },
};

function groupLessons(lessons: PublicLesson[]) {
  return Array.from(
    lessons.reduce((groups, lesson) => {
      const group = groups.get(lesson.moduleSlug) ?? {
        title: lesson.moduleTitle,
        description: lesson.moduleDescription,
        order: lesson.moduleOrder,
        lessons: [],
      };
      group.lessons.push(lesson);
      groups.set(lesson.moduleSlug, group);
      return groups;
    }, new Map<string, { title: string; description: string; order: number; lessons: PublicLesson[] }>()),
  )
    .map(([, group]) => group)
    .sort((a, b) => a.order - b.order);
}

export default function PublicCourseLessonsContent({
  locale,
  course,
  lessons,
}: {
  locale: Locale;
  course: PublicCourse;
  lessons: PublicLesson[];
}) {
  const labels = LABELS[locale];
  const lessonLabels = LESSON_LABELS[locale];
  const level = getTranslation(locale, `courses.general.${course.level}`);
  const language =
    CONTENT_LANGUAGE_OPTIONS.find((item) => item.code === course.languageCode)?.label ??
    course.languageCode;
  const objectives = [
    ...new Set(lessons.map((lesson) => lesson.objective.trim()).filter(Boolean)),
  ].slice(0, 6);
  const modules = groupLessons(lessons);
  const courseHref = `/${locale}/courses/${encodeURIComponent(course.slug)}/lessons`;
  const coursesTitle = getTranslation(locale, 'courses.general.title');
  const lessonsTitle = getTranslation(locale, 'lessons.general.title');
  const breadcrumbJsonLd = buildCourseBreadcrumbJsonLd({
    locale,
    courseName: course.name,
    courseSlug: course.slug,
    coursesLabel: coursesTitle,
    lessonsLabel: lessonsTitle,
  });

  return (
    <article className="mx-auto max-w-5xl px-6 py-6 text-(--text-primary)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-(--text-secondary)">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href={`/${locale}/courses`} className="underline underline-offset-4">
              {coursesTitle}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={courseHref} className="underline underline-offset-4">
              {course.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{lessonsTitle}</li>
        </ol>
      </nav>

      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-bold">
          {course.name} · {lessonsTitle}
        </h1>
        <p className="mt-3 leading-7 text-(--text-secondary)">{course.description}</p>
      </header>

      <section className="mt-6" aria-labelledby="course-overview">
        <h2 id="course-overview" className="text-2xl font-semibold">
          {lessonLabels.overview}
        </h2>
        <p className="mt-2 text-(--text-secondary)">{course.description}</p>
      </section>

      <dl className="mt-6 grid gap-4 rounded-xl border border-(--border-card) bg-(--bg-card) p-5 sm:grid-cols-3">
        <div>
          <dt className="font-medium">{labels.language}</dt>
          <dd className="mt-1 text-(--text-secondary)">{language}</dd>
        </div>
        <div>
          <dt className="font-medium">{getTranslation(locale, 'ranking.general.level')}</dt>
          <dd className="mt-1 text-(--text-secondary)">{level}</dd>
        </div>
        <div>
          <dt className="font-medium">{lessonsTitle}</dt>
          <dd className="mt-1 text-(--text-secondary)">{lessons.length || course.lessonsCount}</dd>
        </div>
      </dl>

      <section className="mt-8" aria-labelledby="course-audience">
        <h2 id="course-audience" className="text-2xl font-semibold">
          {labels.audience}
        </h2>
        <p className="mt-2 text-(--text-secondary)">
          {language} · {level}
        </p>
      </section>

      {objectives.length > 0 && (
        <section className="mt-8" aria-labelledby="course-objectives">
          <h2 id="course-objectives" className="text-2xl font-semibold">
            {labels.objectives}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-(--text-secondary)">
            {objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>
      )}

      {course.supportedLayouts.length > 0 && (
        <section className="mt-8" aria-labelledby="course-requirements">
          <h2 id="course-requirements" className="text-2xl font-semibold">
            {labels.requirements}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={labels.requirements}>
            {course.supportedLayouts.map((layout) => (
              <li
                key={layout}
                className="rounded-full border border-(--border-card) px-3 py-1 text-sm text-(--text-secondary)"
              >
                {layout}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-labelledby="course-lessons">
        <h2 id="course-lessons" className="text-2xl font-semibold">
          {lessonLabels.contents}
        </h2>
        <div className="mt-4 space-y-8">
          {modules.map((module, moduleIndex) => (
            <section
              key={`${module.order}-${module.title}`}
              aria-labelledby={`module-${moduleIndex}`}
            >
              <h3 id={`module-${moduleIndex}`} className="text-xl font-semibold">
                {module.title || lessonsTitle}
              </h3>
              {module.description && (
                <p className="mt-2 text-(--text-secondary)">{module.description}</p>
              )}
              <ol className="mt-4 space-y-3">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="rounded-lg border border-(--border-card) bg-(--bg-card) p-4"
                  >
                    <h4 className="font-semibold">
                      <Link
                        href={`${courseHref}/${encodeURIComponent(lesson.slug)}`}
                        className="underline underline-offset-4"
                      >
                        {lesson.order}. {lesson.title}
                      </Link>
                    </h4>
                    {(lesson.objective || lesson.description) && (
                      <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
                        {lesson.objective || lesson.description}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-(--border-card) bg-(--bg-card) p-5">
        <h2 className="text-xl font-semibold">{labels.relatedPractice}</h2>
        <Link
          href={`/${locale}/practice`}
          className="mt-3 inline-block underline underline-offset-4"
        >
          {getTranslation(locale, 'practice.general.title')}
        </Link>
      </section>
    </article>
  );
}
