import type { Metadata } from 'next';

import { privatePageMetadata } from '@/lib/privatePageMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return privatePageMetadata(lang, 'profile');
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
