import type { MetadataRoute } from 'next';
import { getHreflangAlternates, SUPPORTED_LOCALES, type Locale } from '@/lib/locales';
import { getServerApiBaseUrl } from '@/lib/serverApi';

const baseUrl = 'https://kisodesk.online';
export const revalidate = 3600;

const publicRoutes = ['', 'about', 'privacy', 'terms', 'cookies', 'courses', 'practice', 'ranking'];

type SitemapCourse = {
  slug?: unknown;
  localeCode?: unknown;
};

function isCanonicalLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

async function getCourseListingEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const response = await fetch(`${getServerApiBaseUrl()}/courses`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];

    const courses = (await response.json()) as SitemapCourse[];
    if (!Array.isArray(courses)) return [];

    return courses.flatMap(({ slug, localeCode }) => {
      if (typeof slug !== 'string' || !slug.trim() || !isCanonicalLocale(localeCode)) return [];

      return [
        {
          url: `${baseUrl}/${localeCode}/courses/${encodeURIComponent(slug)}/lessons`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ];
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.flatMap((route) =>
    SUPPORTED_LOCALES.map((lang) => {
      const path = route ? `/${lang}/${route}` : `/${lang}`;

      return {
        url: `${baseUrl}${path}`,
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.7,
        alternates: {
          languages: getHreflangAlternates(route ? `/${route}` : '', baseUrl),
        },
      };
    }),
  );

  return [...staticEntries, ...(await getCourseListingEntries())];
}
