import { UsersController } from './users.controller';

describe('UsersController account self-service', () => {
  function createController() {
    const usersService = {
      exportMyData: jest.fn(),
      removeMe: jest.fn(),
    };

    return {
      controller: new UsersController(usersService as any),
      usersService,
    };
  }

  it('entrega la exportación como JSON descargable y no almacenable', async () => {
    const { controller, usersService } = createController();
    const exportData = {
      schemaVersion: 1,
      account: { id: 'user-1', email: 'user@example.com' },
    };
    const reply = {
      header: jest.fn(),
    };
    usersService.exportMyData.mockResolvedValue(exportData);

    await expect(
      controller.exportMe({ user: { id: 'user-1' } } as any, reply as any),
    ).resolves.toEqual(exportData);

    expect(usersService.exportMyData).toHaveBeenCalledWith('user-1');
    expect(reply.header).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringMatching(/^attachment; filename="account-data-\d{4}-\d{2}-\d{2}\.json"$/),
    );
    expect(reply.header).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });

  it('elimina la cuenta y limpia las cookies de sesión', async () => {
    const { controller, usersService } = createController();
    const dto = {
      currentPassword: 'correct-password',
      confirmationEmail: 'user@example.com',
    };
    const reply = {
      clearCookie: jest.fn(),
    };
    usersService.removeMe.mockResolvedValue(undefined);

    await controller.removeMe({ user: { id: 'user-1' } } as any, dto, reply as any);

    expect(usersService.removeMe).toHaveBeenCalledWith('user-1', dto);
    expect(reply.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(reply.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});
