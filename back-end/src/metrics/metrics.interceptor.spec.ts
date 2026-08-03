import { lastValueFrom, of, throwError } from 'rxjs';

import { MetricsInterceptor } from './metrics.interceptor';

describe('MetricsInterceptor', () => {
  function createContext(statusCode = 200, request: Record<string, unknown> = {}) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/health?source=test', ...request }),
        getResponse: () => ({ statusCode }),
      }),
    };
  }

  it('registra duración, ruta, método y estado de respuestas correctas', async () => {
    const observe = jest.fn();
    const labels = jest.fn().mockReturnValue({ observe });
    const interceptor = new MetricsInterceptor({ labels } as any);

    await lastValueFrom(
      interceptor.intercept(createContext(204) as any, { handle: () => of('ok') }),
    );

    expect(labels).toHaveBeenCalledWith('/health', 'GET', '204');
    expect(observe).toHaveBeenCalledWith(expect.any(Number));
  });

  it('registra el estado de respuestas con error y propaga el error', async () => {
    const observe = jest.fn();
    const labels = jest.fn().mockReturnValue({ observe });
    const interceptor = new MetricsInterceptor({ labels } as any);
    const error = { status: 418 };

    await expect(
      lastValueFrom(
        interceptor.intercept(createContext() as any, {
          handle: () => throwError(() => error),
        }),
      ),
    ).rejects.toBe(error);

    expect(labels).toHaveBeenCalledWith('/health', 'GET', '418');
    expect(observe).toHaveBeenCalledWith(expect.any(Number));
  });

  it('normaliza rutas versionadas con parámetros para evitar cardinalidad alta', async () => {
    const observe = jest.fn();
    const labels = jest.fn().mockReturnValue({ observe });
    const interceptor = new MetricsInterceptor({ labels } as any);

    await lastValueFrom(
      interceptor.intercept(
        createContext(200, {
          url: '/v1/friends/550e8400-e29b-41d4-a716-446655440000/practice-stats',
          routeOptions: { url: '/friends/:friendId/practice-stats' },
        }) as any,
        { handle: () => of('ok') },
      ),
    );

    expect(labels).toHaveBeenCalledWith('/v1/friends/:friendId/practice-stats', 'GET', '200');
    expect(observe).toHaveBeenCalledWith(expect.any(Number));
  });
});
