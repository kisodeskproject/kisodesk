import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveLocaleFromAcceptLanguage } from '@/lib/locales';

export default async function RootPage() {
  const headersList = await headers();
  const locale = resolveLocaleFromAcceptLanguage(headersList.get('accept-language'));

  redirect(`/${locale}`);
}
