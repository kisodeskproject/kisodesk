jest.mock('@prisma/client', () => {
  class PrismaClientMock {
    $connect = jest.fn();
    $disconnect = jest.fn();
  }
  return { PrismaClient: PrismaClientMock };
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('onModuleInit llama $connect y onModuleDestroy llama $disconnect', async () => {
    const svc = new PrismaService() as any;
    await svc.onModuleInit();
    await svc.onModuleDestroy?.();
    expect(svc.$connect).toHaveBeenCalled();
    expect(svc.$disconnect).toHaveBeenCalled();
  });

  it('onModuleInit propaga error de conexión', async () => {
    const svc = new PrismaService() as any;
    svc.$connect = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(svc.onModuleInit()).rejects.toThrow('fail');
  });

  it('onModuleDestroy propaga error al cerrar', async () => {
    const svc = new PrismaService() as any;
    svc.$disconnect = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(svc.onModuleDestroy()).rejects.toThrow('fail');
  });
});
