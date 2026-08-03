// components/layout/Sidebar.tsx

'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Keyboard,
  TrendingUp,
  Trophy,
  User,
  Users,
} from 'lucide-react';

import { usePublicTrial } from '@/contexts/PublicTrialContext';
import { useAuth } from '@/contexts/AuthContext';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));
  const isPublicTrial = usePublicTrial();
  const { isAuthenticated } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');

    const syncViewport = () => {
      setIsMobile(media.matches);
    };

    syncViewport();
    media.addEventListener('change', syncViewport);

    return () => {
      media.removeEventListener('change', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [];

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    requestAnimationFrame(() => {
      sidebarRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isMobile, isOpen, onClose]);

  const dashboardNavItems = [
    {
      href: '/dashboard',
      label: t('components.layout.sidebar.general.dashboard'),
      icon: TrendingUp,
    },
    {
      href: '/dashboard/courses',
      label: t('components.layout.sidebar.general.courses'),
      icon: BookOpen,
    },
    {
      href: '/dashboard/practice',
      label: t('components.layout.sidebar.general.practice'),
      icon: Keyboard,
    },
    {
      href: '/dashboard/ranking',
      label: t('components.layout.sidebar.general.ranking'),
      icon: Trophy,
    },
    ...(isAuthenticated
      ? [
          {
            href: '/dashboard/friends',
            label: t('components.layout.sidebar.general.friends'),
            icon: Users,
          },
          {
            href: '/dashboard/profile',
            label: t('components.layout.sidebar.general.profile'),
            icon: User,
          },
        ]
      : []),
  ];

  const publicNavItems = [
    {
      href: '/dashboard',
      label: t('components.layout.sidebar.general.dashboard'),
      icon: TrendingUp,
    },
    {
      href: '/courses',
      label: t('components.layout.sidebar.general.courses'),
      icon: BookOpen,
    },
    {
      href: '/practice',
      label: t('components.layout.sidebar.general.practice'),
      icon: Keyboard,
    },
    {
      href: '/ranking',
      label: t('components.layout.sidebar.general.ranking'),
      icon: Trophy,
    },
  ];

  const navItems = isPublicTrial ? publicNavItems : dashboardNavItems;

  const isActive = (href: string) => {
    const fullPath = `/${lang}${href}`;

    if (href === '/dashboard') {
      return pathname === fullPath;
    }

    return pathname === fullPath || pathname?.startsWith(`${fullPath}/`);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-(--surface-overlay-soft) backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        role={isOpen && isMobile ? 'dialog' : undefined}
        aria-modal={isOpen && isMobile ? true : undefined}
        aria-label={
          isOpen && isMobile ? t('components.layout.sidebar.general.menuToggle') : undefined
        }
        className={`fixed top-0 left-0 z-50 h-full w-64 transform border-r border-slate-700/60 bg-slate-800/60 shadow-2xl backdrop-blur-xl transition-all duration-300 light:border-slate-700 light:bg-(--sidebar-light-background) md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div
          className={`border-b border-slate-700/60 p-4 light:border-slate-700 ${
            collapsed ? 'md:flex md:justify-center' : ''
          }`}
        >
          {collapsed ? (
            <Link href={`/${lang}`} className="block">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 light:bg-(--sidebar-light-background)">
                <img
                  src="/icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ) : (
            <Link href={`/${lang}`} className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 light:bg-(--sidebar-light-background)">
                <img
                  src="/icon.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  aria-hidden="true"
                />
              </div>

              <h2 className="text-xl font-bold text-(--text-primary)">KisoDesk</h2>
            </Link>
          )}
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={`/${lang}${item.href}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg transition-all focus:ring-2 focus:ring-(--accent-blue-border) focus:outline-none focus:ring-inset ${
                  collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3'
                } ${
                  active
                    ? 'border border-(--accent-blue-border) bg-(--accent-blue-bg) text-(--accent-blue)'
                    : 'text-(--text-secondary) hover:bg-(--bg-secondary) hover:text-(--text-primary)'
                }`}
              >
                <Icon
                  className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'} ${
                    active ? '' : 'light:text-(--sidebar-light-icon-color)'
                  }`}
                />

                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`absolute bottom-4 p-4 ${collapsed ? 'flex w-full justify-center' : 'w-full'}`}
        >
          <button
            onClick={onToggleCollapse}
            className={`rounded-lg p-2 transition-colors hover:bg-(--bg-secondary) focus:ring-2 focus:ring-(--accent-blue-border) focus:outline-none ${
              collapsed ? 'flex justify-center' : ''
            }`}
            title={
              collapsed
                ? t('components.layout.sidebar.general.expand')
                : t('components.layout.sidebar.general.collapse')
            }
            aria-label={
              collapsed
                ? t('components.layout.sidebar.general.expand')
                : t('components.layout.sidebar.general.collapse')
            }
            aria-expanded={!collapsed}
          >
            <ChevronLeft
              className={`h-5 w-5 text-(--text-secondary) transition-transform duration-300 light:text-(--sidebar-light-icon-color) ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
