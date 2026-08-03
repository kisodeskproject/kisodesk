// src/metrics/metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge, Histogram } from 'prom-client';

const UUID_PATTERN =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi;
const OBJECT_ID_PATTERN = /\/[0-9a-f]{16,}(?=\/|$)/gi;

function normalizePath(path: string): string {
  return path
    .split('?')[0]
    .replace(UUID_PATTERN, '/:id')
    .replace(OBJECT_ID_PATTERN, '/:id')
    .replace(/\/+/g, '/');
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('typing_http_request_duration_seconds')
    private readonly httpRequestDurationHistogram: Histogram,
    @InjectMetric('typing_http_requests_in_flight')
    private readonly requestsInFlight?: Gauge,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const routePath = request.routeOptions?.url ?? request.routerPath ?? request.url;
    const normalizedRoute = normalizePath(routePath || 'unknown');
    const hasGlobalPrefix =
      request.url?.startsWith('/v1/') &&
      normalizedRoute !== 'unknown' &&
      !normalizedRoute.startsWith('/v1/');
    const handler = hasGlobalPrefix ? `/v1${normalizedRoute}` : normalizedRoute;
    const start = Date.now();
    this.requestsInFlight?.labels(handler).inc();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode.toString();
          const duration = (Date.now() - start) / 1000; // en segundos
          this.httpRequestDurationHistogram.labels(handler, method, statusCode).observe(duration);
        },
        error: (error) => {
          const statusCode = error.status || 500;
          const duration = (Date.now() - start) / 1000;
          this.httpRequestDurationHistogram
            .labels(handler, method, statusCode.toString())
            .observe(duration);
        },
      }),
      finalize(() => this.requestsInFlight?.labels(handler).dec()),
    );
  }
}
