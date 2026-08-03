import { of } from 'rxjs';

import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  it('devuelve el identificador de Fastify en la respuesta', (done) => {
    const header = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ id: 'request-123' }),
        getResponse: () => ({ header }),
      }),
    };
    const next = { handle: () => of('ok') };

    new RequestIdInterceptor().intercept(context as any, next as any).subscribe({
      complete: () => {
        expect(header).toHaveBeenCalledWith('X-Request-ID', 'request-123');
        done();
      },
    });
  });
});
