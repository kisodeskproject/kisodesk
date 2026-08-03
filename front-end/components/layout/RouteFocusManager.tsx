'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function isInternalNavigationLink(target: EventTarget | null) {
  const link = target instanceof Element ? target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) {
    return false;
  }

  const href = link.getAttribute('href');
  return Boolean(href && href.startsWith('/') && !href.startsWith('//'));
}

function isNavigationTrigger(target: EventTarget | null) {
  if (!(target instanceof Element) || target.closest('[contenteditable="true"], input, textarea, select')) {
    return false;
  }

  return isInternalNavigationLink(target) || Boolean(target.closest('button'));
}

/** Moves focus only after user-initiated client navigation, never on initial load. */
export default function RouteFocusManager() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      shouldRestoreFocusRef.current = isNavigationTrigger(event.target);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    const changedRoute = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;
    if (!changedRoute || !shouldRestoreFocusRef.current) return;

    shouldRestoreFocusRef.current = false;
    const frame = requestAnimationFrame(() => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const main = document.getElementById('main-content');
      main?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
