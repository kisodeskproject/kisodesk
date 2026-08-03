import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import sitemap from './sitemap';

describe('sitemap', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it('contains final localized URLs and a direct x-default target', async () => {
    fetchMock.mockResolvedValue({ json: async () => [], ok: true } as Response);

    const entry = (await sitemap()).find(
      (item) => item.url === 'https://kisodesk.online/es-latam/courses',
    );
    const languages = entry?.alternates?.languages as Record<string, string>;

    expect(entry).toBeDefined();
    expect(languages.es).toBe('https://kisodesk.online/es-latam/courses');
    expect(languages.en).toBe('https://kisodesk.online/en-US/courses');
    expect(languages['x-default']).toBe('https://kisodesk.online/es-latam/courses');
    expect(languages['x-default']).not.toContain('/es/courses');
  });

  it('includes a public course listing only for its canonical locale', async () => {
    fetchMock.mockResolvedValue({
      json: async () => [
        { slug: 'english-typing-course', localeCode: 'en-US' },
        { slug: 'curso-latinoamericano', localeCode: 'es-latam' },
        { slug: 'invalid-course', localeCode: 'en' },
      ],
      ok: true,
    } as Response);

    const urls = (await sitemap()).map((item) => item.url);

    expect(urls).toContain('https://kisodesk.online/en-US/courses/english-typing-course/lessons');
    expect(urls).toContain(
      'https://kisodesk.online/es-latam/courses/curso-latinoamericano/lessons',
    );
    expect(urls).not.toContain('https://kisodesk.online/en/courses/invalid-course/lessons');
  });
});
