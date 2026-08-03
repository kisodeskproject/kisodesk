import type { Metadata } from 'next';

import { privatePageMetadata } from '@/lib/privatePageMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return privatePageMetadata(lang, 'courses');
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
