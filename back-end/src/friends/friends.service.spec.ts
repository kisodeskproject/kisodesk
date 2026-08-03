import { ForbiddenException } from '@nestjs/common';

import { FriendsService } from './friends.service';

describe('FriendsService social privacy', () => {
  function createService() {
    const prisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      $transaction: jest.fn(async (callback) => callback(prisma)),
      user: {
        findUnique: jest.fn(),
      },
      friendship: {
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    prisma.friendship.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (callback: (client: typeof prisma) => unknown) =>
      callback(prisma),
    );
    const practiceService = {
      getStatsForUser: jest.fn(),
    };

    return {
      prisma,
      practiceService,
      service: new FriendsService(prisma as any, practiceService as any),
    };
  }

  it('oculta presencia y estadísticas cuando el amigo no las comparte', async () => {
    const { prisma, practiceService, service } = createService();
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'friendship-1',
        requesterId: 'user-1',
        addresseeId: 'user-2',
        requesterAlias: 'alpha',
        addresseeAlias: 'beta',
        requesterPresenceVisible: false,
        addresseePresenceVisible: false,
        requesterStatsVisible: false,
        addresseeStatsVisible: false,
        requesterLastSeenAt: new Date(),
        addresseeLastSeenAt: new Date(),
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        createdAt: new Date(),
      },
    ]);

    const result = await service.listFriends('user-1');

    expect(result.friends[0]).toEqual(
      expect.objectContaining({
        id: 'user-2',
        name: 'beta',
        online: false,
        lastSeenAt: null,
        presenceVisible: false,
        statsVisible: false,
        practiceStats: null,
      }),
    );
    expect(result.friends[0]).not.toHaveProperty('email');
    expect(practiceService.getStatsForUser).not.toHaveBeenCalled();
  });

  it('busca solo por alias y no devuelve correo, presencia ni estadísticas', async () => {
    const { prisma, service } = createService();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: 'user-2', publicAlias: 'beta_user' }])
      .mockResolvedValueOnce([]);

    const result = await service.searchUsers('user-1', 'beta', 10);

    expect(result.users).toEqual([
      {
        id: 'user-2',
        name: 'beta_user',
        friendshipStatus: 'none',
      },
    ]);
    expect(result.users[0]).not.toHaveProperty('email');
    expect(result.users[0]).not.toHaveProperty('lastSeenAt');
    expect(result.users[0]).not.toHaveProperty('practiceStats');
  });

  it('impide solicitudes cuando cualquiera de las partes bloqueó la relación', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      publicAlias: 'beta',
      allowFriendRequests: true,
    });
    prisma.friendship.findMany.mockResolvedValue([{ id: 'block-1', status: 'BLOCKED' }]);

    await expect(service.sendRequest('user-1', 'user-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('crea una solicitud de amistad con id generado por Prisma', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      publicAlias: 'beta',
      allowFriendRequests: true,
    });
    prisma.friendship.create.mockResolvedValue({ id: 'friendship-1' });

    await expect(service.sendRequest('user-1', 'user-2')).resolves.toEqual({
      id: 'friendship-1',
    });

    expect(prisma.friendship.create).toHaveBeenCalledWith({
      data: {
        requesterId: 'user-1',
        addresseeId: 'user-2',
        status: 'PENDING',
      },
      select: { id: true },
    });
  });

  it('bloquear elimina cualquier relación previa y crea un bloqueo dirigido', async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      publicAlias: 'beta',
      allowFriendRequests: true,
    });
    prisma.$transaction.mockResolvedValue([]);

    await expect(service.blockUser('user-1', 'user-2')).resolves.toEqual({ id: 'user-2' });

    expect(prisma.friendship.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { requesterId: 'user-1', addresseeId: 'user-2' },
          { requesterId: 'user-2', addresseeId: 'user-1' },
        ],
      },
    });
    expect(prisma.friendship.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          requesterId: 'user-1',
          addresseeId: 'user-2',
          status: 'BLOCKED',
        },
      }),
    );
  });
});
