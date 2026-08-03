import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

import { FrontendTelemetryEventDto } from './dto/frontend-telemetry.dto';

const ROUTES = new Set([
  '/:locale',
  '/:locale/login',
  '/:locale/register',
  '/:locale/reset-password',
  '/:locale/practice',
  '/:locale/courses',
  '/:locale/courses/:courseId/lessons',
  '/:locale/courses/:courseId/lessons/:lessonId',
  '/:locale/ranking',
  '/:locale/dashboard',
  '/:locale/dashboard/practice',
  '/:locale/dashboard/courses',
  '/:locale/dashboard/courses/:courseId/lessons',
  '/:locale/dashboard/courses/:courseId/lessons/:lessonId',
  '/:locale/dashboard/profile',
  '/:locale/dashboard/friends',
  '/:locale/dashboard/ranking',
]);
const LOCALES = new Set(['cs', 'da', 'de', 'en-US', 'en-GB', 'es-ES', 'es-latam', 'fr', 'hr', 'hu', 'it', 'nl', 'no', 'pl', 'pt-BR', 'pt-PT', 'ro', 'sv', 'tr']);

function normalizeRoute(value: string) {
  const path = value.split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return 'unknown';
  const normalized = ['/:locale', ...parts.slice(1).map((part) => {
    if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part)) return ':lessonId';
    return part;
  })].join('/');
  if (ROUTES.has(normalized)) return normalized;
  if (/^\/:locale\/(courses|dashboard\/courses)\/[^/]+\/lessons$/.test(normalized)) return normalized.replace(/\/[^/]+\/lessons$/, '/:courseId/lessons');
  if (/^\/:locale\/(courses|dashboard\/courses)\/[^/]+\/lessons\/[^/]+$/.test(normalized)) return normalized.replace(/\/[^/]+\/lessons\/[^/]+$/, '/:courseId/lessons/:lessonId');
  return 'unknown';
}

function localeFromRoute(value: string) {
  const locale = value.split(/[/?#]/, 2)[1];
  return locale && LOCALES.has(locale) ? locale : 'unknown';
}

@Injectable()
export class FrontendTelemetryService {
  private readonly frontendVersion: string;

  constructor(
    config: ConfigService,
    @InjectMetric('typing_frontend_web_vital_seconds') private readonly vitals: Histogram,
    @InjectMetric('typing_frontend_cls') private readonly cls: Histogram,
    @InjectMetric('typing_frontend_navigation_duration_seconds') private readonly navigation: Histogram,
    @InjectMetric('typing_frontend_errors_total') private readonly errors: Counter,
    @InjectMetric('typing_frontend_requests_failed_total') private readonly failedRequests: Counter,
    @InjectMetric('typing_frontend_request_duration_seconds') private readonly requestDuration: Histogram,
    @InjectMetric('typing_frontend_sessions_observed_total') private readonly sessions: Counter,
    @InjectMetric('typing_frontend_sessions_by_locale_total') private readonly sessionsByLocale: Counter,
  ) {
    const configuredVersion = config.get<string>('FRONTEND_RELEASE_VERSION');
    this.frontendVersion = configuredVersion && /^[a-zA-Z0-9._-]{1,64}$/.test(configuredVersion)
      ? configuredVersion
      : 'unknown';
  }

  record(events: FrontendTelemetryEventDto[]) {
    for (const event of events) this.recordEvent(event);
  }

  private recordEvent(event: FrontendTelemetryEventDto) {
    const route = normalizeRoute(event.route);
    if (event.type === 'session') {
      this.sessions.labels(this.frontendVersion).inc();
      this.sessionsByLocale.labels(localeFromRoute(event.route), this.frontendVersion).inc();
      return;
    }
    if (event.type === 'vital' && event.metricName && event.value !== undefined) {
      if (event.metricName === 'cls') this.cls.labels(route, this.frontendVersion).observe(event.value);
      else this.vitals.labels(event.metricName, route, this.frontendVersion).observe(event.value);
      return;
    }
    if (event.type === 'navigation' && event.value !== undefined) {
      this.navigation.labels(route, this.frontendVersion).observe(event.value);
      return;
    }
    if (event.type === 'error' && event.errorCategory) {
      this.errors.labels(event.errorCategory, route, this.frontendVersion).inc();
      return;
    }
    if (event.type === 'request' && event.value !== undefined && event.statusClass) {
      this.requestDuration.labels(route, event.statusClass, this.frontendVersion).observe(event.value);
      if (event.statusClass === '4xx' || event.statusClass === '5xx' || event.statusClass === 'network') {
        this.failedRequests.labels(route, event.statusClass, this.frontendVersion).inc();
      }
    }
  }
}
