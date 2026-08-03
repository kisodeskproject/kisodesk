import { afterEach, describe, expect, it } from '@jest/globals';

import { getServerApiBaseUrl } from './serverApi';

const originalServerApiUrl = process.env.SERVER_API_URL;
const originalApiBaseUrl = process.env.API_BASE_URL;
const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (originalServerApiUrl === undefined) delete process.env.SERVER_API_URL;
  else process.env.SERVER_API_URL = originalServerApiUrl;

  if (originalApiBaseUrl === undefined) delete process.env.API_BASE_URL;
  else process.env.API_BASE_URL = originalApiBaseUrl;

  if (originalPublicApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalPublicApiUrl;
});

describe('getServerApiBaseUrl', () => {
  it('uses the private server URL instead of NEXT_PUBLIC_API_URL', () => {
    process.env.SERVER_API_URL = 'http://api:3000/';
    process.env.API_BASE_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_API_URL = 'https://public.example';

    expect(getServerApiBaseUrl()).toBe('http://api:3000/v1');
  });

  it('accepts a base URL that already includes v1', () => {
    process.env.SERVER_API_URL = 'https://api.kisodesk.online/v1/';

    expect(getServerApiBaseUrl()).toBe('https://api.kisodesk.online/v1');
  });
});
