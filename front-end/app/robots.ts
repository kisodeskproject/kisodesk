import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/lib/locales';

const siteUrl = 'https://kisodesk.online';

const privatePaths = SUPPORTED_LOCALES.flatMap((locale) => [
  `/${locale}/dashboard/`,
  `/${locale}/login`,
  `/${locale}/register`,
  `/${locale}/reset-password`,
]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...privatePaths],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
