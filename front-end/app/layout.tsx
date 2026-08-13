import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  Courier_Prime,
  Fira_Code,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Source_Code_Pro,
} from 'next/font/google';
import { getHtmlLang, toSupportedLocale } from '@/lib/locales';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source' });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-ibm',
});
const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-courier',
});

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
      className={`h-full dark ${jetbrainsMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${ibmPlexMono.variable} ${courierPrime.variable}`}
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
