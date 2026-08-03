// app/[lang]/dashboard/keyboard-identifier/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import KeyboardDetectionWizard from '@/components/lessons/KeyboardDetectionWizard';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import { toSupportedLocale } from '@/lib/i18n';

export default function KeyboardIdentifierPage() {
  const params = useParams();
  const router = useRouter();
  const lang = toSupportedLocale(params.lang);
  const { setPhysicalFamily } = useKeyboardLayout();

  return (
    <DashboardBackground>
      <div className="mx-auto max-w-4xl p-6">
        <KeyboardDetectionWizard
          lang={lang}
          onSelectPhysicalFamily={setPhysicalFamily ?? (() => undefined)}
          onComplete={() => router.push(`/${lang}/dashboard/courses`)}
        />
      </div>
    </DashboardBackground>
  );
}
