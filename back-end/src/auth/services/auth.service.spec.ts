import { createHash } from 'crypto';

import { BadRequestException } from '@nestjs/common';
import { AuthProvider, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

describe('AuthService password reset', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    sessionVersion: 0,
  };

  function createService() {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(prisma)),
    };
    const jwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PASSWORD_RESET_TOKEN_TTL_MINUTES' ? 60 : fallback,
      ),
    };
    const passwordResetMail = {
      isConfigured: jest.fn().mockReturnValue(true),
      sendPasswordResetEmail: jest.fn(),
    };
    const authRateLimit = { checkEmailLimit: jest.fn() };
    const registrationsCounter = { inc: jest.fn() };
    const loginsCounter = { inc: jest.fn() };
    const service = new AuthService(
      prisma as any,
      jwt as any,
      config as any,
      passwordResetMail as any,
      authRateLimit as any,
      registrationsCounter as any,
      loginsCounter as any,
    );

    return { config, jwt, passwordResetMail, prisma, service };
  }

  it('no revela ni genera tokens para correos inexistentes', async () => {
    const { passwordResetMail, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.requestPasswordReset({ email: 'missing@example.com', locale: 'es' }),
    ).resolves.toBeUndefined();

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(passwordResetMail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('almacena solo el hash y envía un token opaco con vencimiento', async () => {
    const { passwordResetMail, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.create.mockImplementation(async ({ data }: any) => ({
      id: 'reset-1',
      ...data,
    }));

    const before = Date.now();
    await service.requestPasswordReset({ email: user.email, locale: 'en' });
    const after = Date.now();

    const emailCall = passwordResetMail.sendPasswordResetEmail.mock.calls[0][0];
    const createCall = prisma.passwordResetToken.create.mock.calls[0][0].data;

    expect(emailCall.to).toBe(user.email);
    expect(emailCall.locale).toBe('en');
    expect(emailCall.token).toMatch(/^[a-f0-9]{64}$/);
    expect(createCall.tokenHash).toBe(createHash('sha256').update(emailCall.token).digest('hex'));
    expect(createCall.tokenHash).not.toBe(emailCall.token);
    expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 60 * 60_000);
    expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(after + 60 * 60_000);
  });

  it('elimina el token si el correo no puede enviarse', async () => {
    const { passwordResetMail, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'reset-1' });
    passwordResetMail.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP failure'));

    await expect(
      service.requestPasswordReset({ email: user.email, locale: 'es' }),
    ).resolves.toBeUndefined();

    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
    });
  });

  it('rechaza tokens vencidos antes de modificar la contraseña', async () => {
    const { prisma, service } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: user.id,
      expiresAt: new Date(Date.now() - 1),
      usedAt: null,
    });

    await expect(
      service.resetPassword({ token: 'a'.repeat(64), newPassword: 'NewPassword1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('consume el token, cambia la contraseña y revoca todas las sesiones', async () => {
    const { prisma, service } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.update.mockResolvedValue(user);
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await service.resetPassword({
      token: 'a'.repeat(64),
      newPassword: 'NewPassword1!',
    });

    const userUpdate = prisma.user.update.mock.calls[0][0];
    expect(await bcrypt.compare('NewPassword1!', userUpdate.data.passwordHash)).toBe(true);
    expect(userUpdate.data.sessionVersion).toEqual({ increment: 1 });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledTimes(2);
  });

  it('impide reutilización concurrente cuando el token ya fue reclamado', async () => {
    const { prisma, service } = createService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'reset-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.resetPassword({ token: 'a'.repeat(64), newPassword: 'NewPassword1!' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('vincula Google a una cuenta de contraseña del mismo correo verificado', async () => {
    const { config, jwt, prisma, service } = createService();
    const passwordUser = {
      id: 'user-1',
      email: 'user@example.com',
      role: Role.USER,
      sessionVersion: 0,
      authProvider: AuthProvider.PASSWORD,
      googleId: null,
      emailVerified: false,
    };

    config.get.mockImplementation((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') return 'google-client-id';
      if (key === 'GOOGLE_CLIENT_SECRET') return 'google-client-secret';
      if (key === 'GOOGLE_REDIRECT_URI') return 'https://api.example.com/v1/auth/google/callback';
      return undefined;
    });
    prisma.user.findUnique.mockResolvedValue(passwordUser);
    prisma.user.update.mockResolvedValue({
      ...passwordUser,
      googleId: 'google-subject',
      emailVerified: true,
    });
    prisma.refreshToken.create.mockResolvedValue({});
    jwt.sign.mockReturnValue('access-token');

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'google-access-token' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-subject',
          email: 'USER@example.com',
          email_verified: true,
        }),
      } as Response);

    await expect(service.loginWithGoogle('authorization-code')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: expect.any(String),
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: passwordUser.id },
      data: { googleId: 'google-subject', emailVerified: true },
    });
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty('authProvider');
    fetchSpy.mockRestore();
  });
});
