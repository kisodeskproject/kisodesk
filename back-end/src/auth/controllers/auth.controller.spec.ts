import { AuthController } from './auth.controller';
import { ForbiddenException } from '@nestjs/common';

describe('AuthController cookie scope', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('comparte cookies de autenticación con el frontend en producción', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      AUTH_COOKIE_DOMAIN: '.kisodesk.online',
    };
    const response = { setCookie: jest.fn(), clearCookie: jest.fn() };
    const controller = new AuthController({} as any);

    (controller as any).setAuthCookies(response, 'access-token', 'refresh-token');

    expect(response.setCookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({
        domain: '.kisodesk.online',
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 2 * 60 * 60,
      }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ path: '/', secure: true }),
    );
  });

  it('no define domain en desarrollo', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    const response = { setCookie: jest.fn(), clearCookie: jest.fn() };
    const controller = new AuthController({} as any);

    (controller as any).setAuthCookies(response, 'access-token', 'refresh-token');

    expect(response.setCookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({ domain: undefined, secure: false }),
    );
    expect(response.clearCookie).not.toHaveBeenCalled();
  });

  it('emite cookies compartidas y limpia cookies host-only en el callback de Google', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      AUTH_COOKIE_DOMAIN: '.kisodesk.online',
      FRONTEND_URL: 'https://kisodesk.online',
    };
    const authService = {
      parseGoogleOAuthState: jest.fn().mockReturnValue({
        lang: 'en',
        termsAccepted: true,
        privacyAccepted: true,
        intent: 'login',
      }),
      loginWithGoogle: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    };
    const response = {
      setCookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
    };
    const controller = new AuthController(authService as any);

    await controller.googleCallback(
      'code',
      'en:1:1',
      undefined,
      { id: 'request-test' } as any,
      response as any,
    );

    expect(authService.loginWithGoogle).toHaveBeenCalledWith('code', {
      termsAccepted: true,
      privacyAccepted: true,
    });
    expect(response.setCookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.objectContaining({
        domain: '.kisodesk.online',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/', secure: true }),
    );
    expect(response.redirect).toHaveBeenCalledWith('https://kisodesk.online/en-US/dashboard');
  });

  it('redirige al registro cuando Google corresponde a una cuenta nueva sin consentimiento', async () => {
    process.env = { ...originalEnv, FRONTEND_URL: 'https://kisodesk.online' };
    const authService = {
      parseGoogleOAuthState: jest.fn().mockReturnValue({
        lang: 'es',
        termsAccepted: false,
        privacyAccepted: false,
        intent: 'login',
      }),
      loginWithGoogle: jest
        .fn()
        .mockRejectedValue(new ForbiddenException({ code: 'GOOGLE_CONSENT_REQUIRED' })),
    };
    const response = { status: jest.fn().mockReturnThis(), redirect: jest.fn() };
    const controller = new AuthController(authService as any);

    await controller.googleCallback(
      'code',
      'state',
      undefined,
      { id: 'request-test' } as any,
      response as any,
    );

    expect(response.redirect).toHaveBeenCalledWith(
      'https://kisodesk.online/es-latam/register?google=consent-required',
    );
  });
});
