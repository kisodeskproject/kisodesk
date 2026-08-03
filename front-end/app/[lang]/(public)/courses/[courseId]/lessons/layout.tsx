// front-typing/app/[lang]/public/courses/[courseId]/lessons/layout.tsx

'use client';

import { LessonPracticeProvider } from '@/contexts/LessonPracticeContext';

interface PublicLessonsLayoutProps {
  children: React.ReactNode;
}

export default function PublicLessonsLayout({ children }: PublicLessonsLayoutProps) {
  return <LessonPracticeProvider>{children}</LessonPracticeProvider>;
}
