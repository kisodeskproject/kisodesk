import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { hasAuthenticatedSession } from './authSession';

describe('hasAuthenticatedSession', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(global, 'fetch', { configurable: true, value: originalFetch });
  });

  it('reconoce la cookie access_token esperada por el middleware', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: true }),
    } as Response);
    Object.defineProperty(global, 'fetch', { configurable: true, value: fetchMock });
    const request = {
      cookies: { get: () => ({ value: 'valid-access-token' }) },
    };

    await expect(hasAuthenticatedSession(request)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/me'),
      expect.objectContaining({ headers: expect.objectContaining({ Cookie: 'access_token=valid-access-token' }) }),
    );
  });

  it('no consulta la API cuando falta access_token', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    Object.defineProperty(global, 'fetch', { configurable: true, value: fetchMock });
    const request = { cookies: { get: () => undefined } };

    await expect(hasAuthenticatedSession(request)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
