// src/health/health.controller.spec.ts
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import { HealthController } from './health.controller';

describe('Health throttling', () => {
  it('omite todos los perfiles de throttling operativos', async () => {
    const storage = { increment: jest.fn() };
    const guard = new ThrottlerGuard(
      {
        throttlers: [
          { name: 'global', limit: 100, ttl: 300_000 },
          { name: 'auth', limit: 30, ttl: 300_000 },
        ],
      },
      storage as any,
      new Reflector(),
    );
    await guard.onModuleInit();

    const context = {
      getHandler: () => HealthController.prototype.check,
      getClass: () => HealthController,
      switchToHttp: () => ({
        getRequest: () => ({ ip: '127.0.0.1', headers: {} }),
        getResponse: () => ({ header: jest.fn() }),
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(storage.increment).not.toHaveBeenCalled();
  });
});

describe('HealthController', () => {
  let controller: HealthController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue({ status: 'ok' }) },
        },
        {
          provide: HttpHealthIndicator,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('check()', async () => {
    const res = await controller.check();
    expect(res).toEqual({ status: 'ok' });
  });

  it('live()', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('ready()', () => {
    expect(controller.ready()).toEqual({ status: 'ok' });
  });
});
