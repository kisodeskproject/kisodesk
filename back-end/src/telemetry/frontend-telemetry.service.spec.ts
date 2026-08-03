import { FrontendTelemetryService } from './frontend-telemetry.service';

function metric() {
  const inc = jest.fn();
  const observe = jest.fn();
  return { labels: jest.fn(() => ({ inc, observe })), inc, observe };
}

describe('FrontendTelemetryService', () => {
  it('normaliza rutas y no usa la ruta libre como label', () => {
    const vitals = metric();
    const service = new FrontendTelemetryService(
      { get: () => 'v1.2.3' } as any,
      vitals as any, metric() as any, metric() as any, metric() as any,
      metric() as any, metric() as any, metric() as any, metric() as any,
    );

    service.record([{ type: 'vital', route: '/es-latam/users/secret?token=hidden', metricName: 'lcp', value: 1 }]);

    expect(vitals.labels).toHaveBeenCalledWith('lcp', 'unknown', 'v1.2.3');
  });

  it('acepta únicamente una categoría de estado controlada para solicitudes', () => {
    const requests = metric();
    const failed = metric();
    const service = new FrontendTelemetryService(
      { get: () => undefined } as any,
      metric() as any, metric() as any, metric() as any, metric() as any,
      failed as any, requests as any, metric() as any, metric() as any,
    );

    service.record([{ type: 'request', route: '/es-latam/practice', statusClass: '5xx', value: 0.5 }]);

    expect(requests.labels).toHaveBeenCalledWith('/:locale/practice', '5xx', 'unknown');
    expect(failed.labels).toHaveBeenCalledWith('/:locale/practice', '5xx', 'unknown');
  });
});
