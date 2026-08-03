// app/[lang]/(marketing)/layout.tsx

'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import CookieBanner from '@/components/legal/CookieBanner';
import ThirdPartyScriptsGate from '@/components/legal/ThirdPartyScriptsGate';

const Footer = dynamic(() => import('@/components/layout/Footer'), {
  ssr: false,
});

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const params = useParams();
  const lang = (params.lang as string) || 'es';

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative z-50">
        <Header />
      </div>

      <main id="main-content" tabIndex={-1} className="pt-16 focus:outline-none">
        {children}
      </main>

      <Footer />
      <CookieBanner lang={lang} />
      <ThirdPartyScriptsGate />
    </div>
  );
}
