import { BadRequestException } from '@nestjs/common';

import { GlobalHttpExceptionFilter } from './global-http-exception.filter';

describe('GlobalHttpExceptionFilter', () => {
  function createHost() {
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const request = { id: 'request-123', method: 'GET', url: '/v1/example' };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ status }),
      }),
    };

    return { host, send, status };
  }

  it('oculta detalles de errores internos', () => {
    const { host, send, status } = createHost();

    new GlobalHttpExceptionFilter().catch(new Error('database password leaked'), host as any);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
  });

  it('conserva la respuesta de errores de cliente', () => {
    const { host, send, status } = createHost();

    new GlobalHttpExceptionFilter().catch(new BadRequestException('Campo inválido'), host as any);

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith({ statusCode: 400, message: 'Campo inválido' });
  });
});
