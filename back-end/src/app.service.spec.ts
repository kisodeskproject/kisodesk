// backend/src/app.service.spec.ts
import { AppService } from './app.service';

describe('AppService', () => {
  it('getHello retorna algo', () => {
    const svc = new AppService();
    // si el método tiene otro nombre, ajusta aquí
    expect((svc as any).getHello()).toBeDefined();
  });
});
