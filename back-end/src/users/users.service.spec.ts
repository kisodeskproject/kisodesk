import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';

describe('UsersService account self-service', () => {
  function createService() {
    const prisma: any = {
      user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: { deleteMany: jest.fn() },
    };
    prisma.$transaction = jest.fn(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
    return {
      prisma,
      service: new UsersService(prisma as any),
    };
  }

  it('exporta datos sin solicitar passwordHash ni valores de refresh token', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      refreshTokens: [{ createdAt: new Date(), expiresAt: new Date(), revokedAt: null }],
    });

    const result = await service.exportMyData('user-1');

    expect(result.schemaVersion).toBe(1);
    expect(result.account.email).toBe('user@example.com');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        select: expect.not.objectContaining({ passwordHash: expect.anything() }),
      }),
    );

    const select = prisma.user.findUnique.mock.calls[0][0].select;
    expect(select.refreshTokens.select).not.toHaveProperty('token');
  });

  it('elimina la propia cuenta después de verificar correo y contraseña', async () => {
    const { prisma, service } = createService();
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.user.findUnique.mockResolvedValue({
      email: 'user@example.com',
      passwordHash,
      authProvider: 'PASSWORD',
    });
    prisma.user.delete.mockResolvedValue({ id: 'user-1' });

    await service.removeMe('user-1', {
      currentPassword: 'correct-password',
      confirmationEmail: 'USER@example.com',
    }, Math.floor(Date.now() / 1000));

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('rechaza la eliminación cuando el correo de confirmación no coincide', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      email: 'user@example.com',
      passwordHash: 'unused',
    });

    await expect(
      service.removeMe('user-1', {
        currentPassword: 'correct-password',
        confirmationEmail: 'other@example.com',
      }, Math.floor(Date.now() / 1000)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('rechaza la eliminación cuando la contraseña es incorrecta', async () => {
    const { prisma, service } = createService();
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.user.findUnique.mockResolvedValue({
      email: 'user@example.com',
      passwordHash,
    });

    await expect(
      service.removeMe('user-1', {
        currentPassword: 'wrong-password',
        confirmationEmail: 'user@example.com',
      }, Math.floor(Date.now() / 1000)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('exige alias antes de activar funciones sociales', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({ publicAlias: null });

    await expect(
      service.updateMe('user-1', {
        showInRanking: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('normaliza el alias y conserva controles sociales separados', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      publicAlias: null,
      showInRanking: true,
      searchableByAlias: true,
      showPresenceToFriends: true,
      shareStatsWithFriends: true,
      allowFriendRequests: true,
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      publicAlias: 'alpha_user',
      showInRanking: true,
      searchableByAlias: false,
    });

    await service.updateMe('user-1', {
      publicAlias: 'Alpha_User',
      showInRanking: true,
      searchableByAlias: false,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          publicAlias: 'alpha_user',
          showInRanking: true,
          searchableByAlias: false,
        }),
      }),
    );
  });

  it('guarda el país declarado desde el perfil', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      publicAlias: 'alpha_user',
      showInRanking: true,
      searchableByAlias: true,
      showPresenceToFriends: true,
      shareStatsWithFriends: true,
      allowFriendRequests: true,
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1', countryCode: 'MX' });

    await service.updateMe('user-1', { countryCode: 'MX' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ countryCode: 'MX' }) }),
    );
  });

  it('permite borrar el alias solo cuando todas las funciones sociales quedan desactivadas', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      publicAlias: 'alpha_user',
      showInRanking: false,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1', publicAlias: null });

    await service.updateMe('user-1', { publicAlias: null });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ publicAlias: null }) }),
    );
  });

  it('rechaza borrar el alias si una función social permanece activada', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      publicAlias: 'alpha_user',
      showInRanking: true,
      searchableByAlias: false,
      showPresenceToFriends: false,
      shareStatsWithFriends: false,
      allowFriendRequests: false,
    });

    await expect(service.updateMe('user-1', { publicAlias: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
