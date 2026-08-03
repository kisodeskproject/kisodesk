// app/page.tsx
// Detectar el idioma preferido del usuario y redirigir

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveLocaleFromAcceptLanguage } from '@/lib/locales';

// COMPONENTE PRINCIPAL
export default async function RootPage() {
  // OBTENER CABECERAS HTTP
  const headersList = await headers();
  const locale = resolveLocaleFromAcceptLanguage(headersList.get('accept-language'));

  // REDIRIGIR A LA RUTA LOCALIZADA
  redirect(`/${locale}`);
}
