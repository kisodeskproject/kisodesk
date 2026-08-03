import type { Metadata } from 'next';

import { privatePageMetadata } from '@/lib/privatePageMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return privatePageMetadata(lang, 'practice');
}

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
