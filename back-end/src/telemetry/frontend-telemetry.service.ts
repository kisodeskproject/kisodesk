import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

import { SUPPORTED_LAYOUT_IDS } from '../practice/keyboard-layout-catalog';
import { PrismaService } from '../prisma/prisma.service';

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
const LOCALES = new Set([
  'cs',
  'da',
  'de',
  'en-US',
  'en-GB',
  'es-ES',
  'es-latam',
  'fr',
  'hr',
  'hu',
  'it',
  'nl',
  'no',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'sv',
  'tr',
]);

function normalizeRoute(value: string) {
  const path = value.split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return 'unknown';
  const normalized = [
    '/:locale',
    ...parts.slice(1).map((part) => {
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part)) return ':lessonId';
      return part;
    }),
  ].join('/');
  if (ROUTES.has(normalized)) return normalized;
  if (/^\/:locale\/(courses|dashboard\/courses)\/[^/]+\/lessons$/.test(normalized))
    return normalized.replace(/\/[^/]+\/lessons$/, '/:courseId/lessons');
  if (/^\/:locale\/(courses|dashboard\/courses)\/[^/]+\/lessons\/[^/]+$/.test(normalized))
    return normalized.replace(/\/[^/]+\/lessons\/[^/]+$/, '/:courseId/lessons/:lessonId');
  return 'unknown';
}

function localeFromRoute(value: string) {
  const locale = value.split(/[/?#]/, 2)[1];
  return locale && LOCALES.has(locale) ? locale : 'unknown';
}

function classifyTraffic(userAgent: string, authState?: 'anonymous' | 'authenticated'): string {
  if (!userAgent) return 'unknown';

  const monitoringPatterns = [
    'UptimeRobot',
    'Pingdom',
    'NewRelic',
    'Datadog',
    'StatusCake',
    'Site24x7',
    'HealthCheck',
    'kube-probe',
  ];
  for (const pattern of monitoringPatterns) {
    if (userAgent.includes(pattern)) return 'monitoring';
  }

  const botPatterns = [
    'Googlebot',
    'Bingbot',
    'Slurp',
    'DuckDuckBot',
    'facebookexternalhit',
    'Twitterbot',
    'AhrefsBot',
    'SemrushBot',
    'MJ12bot',
    'rogerbot',
    'Baiduspider',
    'Yandex',
    'Applebot',
    'LinkedInBot',
    'Pinterest',
  ];
  for (const pattern of botPatterns) {
    if (userAgent.includes(pattern)) return 'bot';
  }

  if (authState === 'authenticated') return 'human_authenticated';

  const browserPatterns = [
    'Chrome',
    'Firefox',
    'Safari',
    'Edge',
    'Opera',
    'Mobile',
    'Android',
    'iPhone',
    'iPad',
  ];
  for (const pattern of browserPatterns) {
    if (userAgent.includes(pattern)) return 'human_anonymous';
  }

  return 'unknown';
}

@Injectable()
export class FrontendTelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly frontendVersion: string;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectMetric('typing_frontend_web_vital_seconds') private readonly vitals: Histogram,
    @InjectMetric('typing_frontend_cls') private readonly cls: Histogram,
    @InjectMetric('typing_frontend_navigation_duration_seconds')
    private readonly navigation: Histogram,
    @InjectMetric('typing_frontend_errors_total') private readonly errors: Counter,
    @InjectMetric('typing_frontend_requests_failed_total') private readonly failedRequests: Counter,
    @InjectMetric('typing_frontend_request_duration_seconds')
    private readonly requestDuration: Histogram,
    @InjectMetric('typing_frontend_sessions_observed_total') private readonly sessions: Counter,
    @InjectMetric('typing_frontend_sessions_by_locale_total')
    private readonly sessionsByLocale: Counter,
    @InjectMetric('typing_frontend_initializations_sampled_total')
    private readonly initializations: Counter,
    @InjectMetric('typing_frontend_page_views_observed_total') private readonly pageViews: Counter,
    @InjectMetric('typing_anonymous_sessions_observed_total')
    private readonly anonymousSessions: Counter,
    @InjectMetric('typing_practice_started_observed_total')
    private readonly practiceStarted: Counter,
    @InjectMetric('typing_practice_completed_observed_total')
    private readonly practiceCompleted: Counter,
    @InjectMetric('typing_practice_abandoned_observed_total')
    private readonly practiceAbandoned: Counter,
  ) {
    const configuredVersion = config.get<string>('FRONTEND_RELEASE_VERSION');
    this.frontendVersion =
      configuredVersion && /^[a-zA-Z0-9._-]{1,64}$/.test(configuredVersion)
        ? configuredVersion
        : 'unknown';
  }

  onModuleInit() {
    void this.removeExpiredDailyAnalytics();
    this.cleanupTimer = setInterval(
      () => void this.removeExpiredDailyAnalytics(),
      24 * 60 * 60 * 1000,
    );
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  record(events: FrontendTelemetryEventDto[]) {
    for (const event of events) this.recordEvent(event);
  }

  private recordEvent(event: FrontendTelemetryEventDto) {
    const route = normalizeRoute(event.route);
    if (event.type === 'session') {
      const userAgent = event.userAgent || '';
      const trafficType = classifyTraffic(userAgent, event.authState);
      const language = event.language || 'unknown';

      this.sessions.labels(this.frontendVersion).inc();
      this.sessionsByLocale.labels(localeFromRoute(event.route), this.frontendVersion).inc();
      this.initializations.labels(trafficType, this.frontendVersion, route, language).inc();
      return;
    }
    if (event.type === 'page_view') {
      this.pageViews.labels(route).inc();
      void this.incrementDailyAnonymousAnalytics('page_views');
      return;
    }
    if (event.type === 'analytics_session_started') {
      this.anonymousSessions.inc();
      void this.incrementDailyAnonymousAnalytics('anonymous_sessions');
      return;
    }
    if (
      event.type === 'practice_started' ||
      event.type === 'practice_completed' ||
      event.type === 'practice_abandoned'
    ) {
      if (
        !event.authState ||
        !event.language ||
        !event.layout ||
        !SUPPORTED_LAYOUT_IDS.has(event.layout)
      )
        return;
      const metric =
        event.type === 'practice_started'
          ? this.practiceStarted
          : event.type === 'practice_completed'
            ? this.practiceCompleted
            : this.practiceAbandoned;
      metric.labels(event.authState, event.language, event.layout).inc();
      return;
    }
    if (event.type === 'vital' && event.metricName && event.value !== undefined) {
      if (event.metricName === 'cls')
        this.cls.labels(route, this.frontendVersion).observe(event.value);
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
      this.requestDuration
        .labels(route, event.statusClass, this.frontendVersion)
        .observe(event.value);
      if (
        event.statusClass === '4xx' ||
        event.statusClass === '5xx' ||
        event.statusClass === 'network'
      ) {
        this.failedRequests.labels(route, event.statusClass, this.frontendVersion).inc();
      }
    }
  }

  private async incrementDailyAnonymousAnalytics(column: 'anonymous_sessions' | 'page_views') {
    await this.prisma
      .$executeRawUnsafe(
        `INSERT INTO daily_anonymous_analytics (day, ${column}, created_at, updated_at)
       VALUES (CURRENT_DATE, 1, NOW(), NOW())
       ON CONFLICT (day) DO UPDATE SET ${column} = daily_anonymous_analytics.${column} + 1, updated_at = NOW()`,
      )
      .catch(() => undefined);
  }

  private async removeExpiredDailyAnalytics() {
    await this.prisma
      .$executeRawUnsafe(
        "DELETE FROM daily_anonymous_analytics WHERE day < CURRENT_DATE - INTERVAL '30 days'",
      )
      .catch(() => undefined);
  }
}
