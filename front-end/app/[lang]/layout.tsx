// app/[lang]/layout.tsx
// Layout para rutas localizadas con validación de idioma

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { KeyboardLayoutProvider } from '@/contexts/KeyboardLayoutContext';
import RouteFocusManager from '@/components/layout/RouteFocusManager';
import FrontendObservability from '@/components/observability/FrontendObservability';
import { isSupportedLocale } from '@/lib/i18n';

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  // VALIDAR IDIOMA DE LA URL
  const { lang } = await params;
  // REDIRIGIR A ESPAÑOL SI EL IDIOMA NO ES VÁLIDO
  if (!isSupportedLocale(lang)) {
    redirect('/es-latam');
  }

  // PROVEER CONTEXTO DE AUTENTICACIÓN AL RESTO DE LA PÁGINA
  return (
    <AuthProvider>
      <KeyboardLayoutProvider>
        <RouteFocusManager />
        <FrontendObservability />
        {children}
      </KeyboardLayoutProvider>
    </AuthProvider>
  );
}
