import { Test, TestingModule } from '@nestjs/testing';

import { PingController } from './ping.controller';

describe('PingController', () => {
  let controller: PingController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();
    controller = module.get(PingController);
  });

  it('GET /ping -> get()', () => {
    const res = (controller as any).get();
    expect(res).toBeDefined();
    expect(res.pong).toBe(true);
    expect(typeof res.ts).toBe('string');
  });
});
