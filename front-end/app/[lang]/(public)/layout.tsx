//front-typing/app/lang/public/layout
'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { PublicTrialProvider } from '@/contexts/PublicTrialContext';

export default function PublicTrialLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <PublicTrialProvider>
      <div className="light-uses-dark-surfaces min-h-screen">
        <Header
          showBrand={false}
          showCoursesShortcut={false}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <div
          className={`hidden lg:block fixed top-0 left-0 bottom-0 transition-all duration-300 z-50 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <Sidebar
            isOpen={true}
            onClose={() => {}}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          />
        </div>
        <div className="lg:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={false} />
        </div>
        <main
          id="main-content"
          tabIndex={-1}
          className={`pt-16 focus:outline-none transition-[padding] duration-300 ${
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </PublicTrialProvider>
  );
}
