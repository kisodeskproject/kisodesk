import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  function createStrategy(user: unknown) {
    const config = {
      get: jest.fn().mockReturnValue('test-secret-at-least-16-chars'),
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    };
    return {
      prisma,
      strategy: new JwtStrategy(config as any, prisma as any),
    };
  }

  it('devuelve la identidad vigente desde la base de datos', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      sessionVersion: 2,
    };
    const { strategy } = createStrategy(user);

    const authTime = 1_700_000_000;
    await expect(
      strategy.validate({ sub: 'user-1', email: 'old@example.com', role: 'ADMIN', ver: 2, authTime }),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      role: user.role,
      authTime,
    });
  });

  it('rechaza un JWT si la cuenta ya fue eliminada', async () => {
    const { strategy } = createStrategy(null);

    await expect(
      strategy.validate({ sub: 'deleted-user', email: 'user@example.com', role: 'USER' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza JWT emitidos antes de un cambio de contraseña', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      sessionVersion: 1,
    };
    const { strategy } = createStrategy(user);

    await expect(
      strategy.validate({ sub: user.id, email: user.email, role: user.role, ver: 0 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
