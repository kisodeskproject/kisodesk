import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getHtmlLang, toSupportedLocale } from '@/lib/locales';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kisodesk.online'),
  title: {
    default: 'KisoDesk - Aprende mecanografía',
    template: '%s | KisoDesk',
  },
  description: 'Mejora tu velocidad y precisión.',
  icons: {
    icon: '/icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const lang = toSupportedLocale(requestHeaders.get('x-kiso-locale'));
  const nonce = requestHeaders.get('x-nonce');

  return (
    <html
      lang={getHtmlLang(lang)}
      suppressHydrationWarning
      className="h-full dark"
      style={{ colorScheme: 'dark' }}
    >
      <head>
        <script
          nonce={nonce ?? undefined}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  root.classList.add(theme);
                  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
                  if (stored !== theme) {
                    localStorage.setItem('theme', theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
