import type { Metadata } from 'next';

import DashboardLayout from './DashboardLayoutClient';
import { privatePageMetadata } from '@/lib/privatePageMetadata';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: DashboardLayoutProps): Promise<Metadata> {
  const { lang } = await params;

  return {
    ...privatePageMetadata(lang, 'dashboard'),
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: DashboardLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
