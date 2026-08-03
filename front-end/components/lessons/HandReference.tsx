// components/lessons/HandReference.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

import { toSupportedLocale, useTranslations } from '@/lib/i18n';

interface HandReferenceProps {
  src: string;
  alt?: string;
}

export default function HandReference({ src, alt }: HandReferenceProps) {
  const params = useParams();
  const lang = params.lang as string;
  const t = useTranslations(toSupportedLocale(lang));

  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedAlt = alt ?? t('components.lessons.handReference.general.handReference');

  useEffect(() => {
    setError(false);

    fetch(src)
      .then((response) => response.text())
      .then((text) => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = text;

        const svg = containerRef.current.querySelector('svg');

        if (!svg) return;

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.opacity = '0.85';
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', resolvedAlt);

        const backgroundRectangle = svg.querySelector('rect');
        backgroundRectangle?.remove();

        const paths = svg.querySelectorAll('path');

        paths.forEach((path) => {
          path.setAttribute('fill', 'var(--accent-blue)');
          path.setAttribute('stroke', 'none');
        });
      })
      .catch(() => {
        setError(true);
      });
  }, [resolvedAlt, src]);

  if (error) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-(--border-card) bg-(--bg-card) text-sm text-(--text-tertiary)">
        {resolvedAlt}
      </div>
    );
  }

  return <div ref={containerRef} className="mx-auto w-full max-w-xs animate-fade-in lg:max-w-sm" />;
}
