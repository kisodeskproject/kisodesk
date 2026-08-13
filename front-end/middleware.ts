// middleware.ts
//
// Minimal, public-safe subset of the production middleware. It only sets the
// `x-kiso-locale` request header that `app/layout.tsx` reads to render the
// correct `<html lang>` per route — without this header the document
// language falls back to the default locale on every request, regardless of
// the actual URL locale.
//
// Security- and infrastructure-sensitive behavior (Content-Security-Policy
// nonce generation, canonical-host redirects, internal API-backed slug
// redirects) is intentionally not mirrored here; that logic lives only in
// the private deployment.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { DEFAULT_LOCALE, getCanonicalLocale } from '@/lib/locales';

export function middleware(request: NextRequest) {
  const localeSegment = request.nextUrl.pathname.split('/')[1];
  const canonicalLocale = getCanonicalLocale(localeSegment);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-kiso-locale', canonicalLocale ?? DEFAULT_LOCALE);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
