// components/layout/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, fallback, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const lang = params.lang as string;
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (
      pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/forgot-password') ||
      pathname.includes('/reset-password')
    )
      return;
    if (!loading && !isAuthenticated) {
      router.push(`/${lang}${redirectTo}`);
    }
  }, [loading, isAuthenticated, router, lang, redirectTo, pathname]);

  if (loading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center"></div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
