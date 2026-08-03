// app/[lang]/dashboard/courses/[courseId]/lessons/layout.tsx
import type { Metadata } from 'next';

import { LessonPracticeProvider } from '@/contexts/LessonPracticeContext';
import { privatePageMetadata } from '@/lib/privatePageMetadata';

interface LessonsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LessonsLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  return privatePageMetadata(lang, 'courseLessons');
}

export default function LessonsLayout({ children }: LessonsLayoutProps) {
  return <LessonPracticeProvider>{children}</LessonPracticeProvider>;
}
