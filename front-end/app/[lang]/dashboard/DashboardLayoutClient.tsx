// app/[lang]/dashboard/layout.tsx

'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePresencePing } from '@/hooks/usePresencePing';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  usePresencePing({ enabled: isAuthenticated });

  const isLessonsPanel =
    pathname.startsWith(`/${lang}/dashboard/courses/`) && pathname.includes('/lessons');

  const handleMainClick = useCallback(() => {
    if (!sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [sidebarCollapsed]);

  return (
    <div className="light-uses-dark-surfaces">
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={logout}
        onMenuToggle={() => setSidebarOpen(true)}
        showCoursesShortcut={false}
        hideLanguageSwitcher={false}
        showBrand={isLessonsPanel}
      />

      {!isLessonsPanel && (
        <div
          className={`hidden lg:block fixed top-0 left-0 bottom-0 transition-all duration-300 z-50 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <Sidebar isOpen={true} onClose={() => {}} collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-[23px] top-0 z-30 bg-gray-800 text-gray-400 hover:text-white px-1 py-3 rounded-r-md border border-l-0 border-gray-700 shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-(--accent-blue-border)"
            aria-label={sidebarCollapsed ? t('general.Accessibility.expandMenu') : t('general.Accessibility.collapseMenu')}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      )}

      {!isLessonsPanel && (
        <div className="lg:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={false} />
        </div>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        onClick={handleMainClick}
        className={`min-h-screen focus:outline-none ${isLessonsPanel ? 'pt-16' : 'pt-16 lg:pl-20'}`}
      >
        <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
