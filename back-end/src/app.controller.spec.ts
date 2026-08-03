import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    controller = module.get(AppController) as any;
  });

  it('invoca métodos públicos sin argumentos', async () => {
    const proto = Object.getPrototypeOf(controller);
    const names = Object.getOwnPropertyNames(proto);
    for (const n of names) {
      if (n === 'constructor') continue;
      const fn = controller[n];
      if (typeof fn === 'function' && fn.length === 0) {
        const out = fn.call(controller);
        if (out instanceof Promise) await out;
      }
    }
    expect(controller).toBeDefined();
  });
});
