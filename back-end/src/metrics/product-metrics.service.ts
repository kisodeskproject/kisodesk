import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Prisma } from '@prisma/client';
import { Gauge } from 'prom-client';

import { COUNTRY_CODE_SET } from '../common/country-codes';
import { PrismaService } from '../prisma/prisma.service';
import { SUPPORTED_LAYOUT_IDS } from '../practice/keyboard-layout-catalog';

const WINDOWS = [
  { label: '15m', milliseconds: 15 * 60 * 1000 },
  { label: '1h', milliseconds: 60 * 60 * 1000 },
  { label: '24h', milliseconds: 24 * 60 * 60 * 1000 },
  { label: '7d', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { label: '30d', milliseconds: 30 * 24 * 60 * 60 * 1000 },
] as const;
const RETENTION_DAYS = [1, 7, 30] as const;
const PRACTICE_LANGUAGES = new Set([
  'es', 'en', 'pt', 'fr', 'cs', 'da', 'de', 'hr', 'hu', 'it', 'nl', 'no', 'pl', 'ro', 'sv', 'tr',
]);

type CountRow = { country_code: string | null; value: bigint | number };
type RetentionRow = { cohort_size: bigint | number; retained_size: bigint | number };
type LearningRow = {
  segment: string | null;
  sample_size: bigint | number;
  initial_wpm: number | null;
  recent_wpm: number | null;
  delta_wpm: number | null;
  initial_accuracy: number | null;
  recent_accuracy: number | null;
  delta_accuracy: number | null;
  improved_percent: number | null;
  stable_percent: number | null;
  declined_percent: number | null;
  improved_accuracy_percent: number | null;
  stable_accuracy_percent: number | null;
  declined_accuracy_percent: number | null;
};

const asNumber = (value: bigint | number | null): number => (value === null ? 0 : Number(value));

@Injectable()
export class ProductMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductMetricsService.name);
  private timer?: ReturnType<typeof setInterval>;
  private lastAnalyticsAt = 0;
  private readonly analyticsRefreshMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectMetric('typing_product_active_users') private readonly activeUsers: Gauge,
    @InjectMetric('typing_product_new_users') private readonly newUsers: Gauge,
    @InjectMetric('typing_product_recurring_users') private readonly recurringUsers: Gauge,
    @InjectMetric('typing_product_metrics_last_refresh_timestamp_seconds') private readonly lastRefresh: Gauge,
    @InjectMetric('typing_product_retention_percent') private readonly retention: Gauge,
    @InjectMetric('typing_product_retention_cohort_size') private readonly retentionCohort: Gauge,
    @InjectMetric('typing_product_country_events') private readonly countryEvents: Gauge,
    @InjectMetric('typing_product_learning_wpm') private readonly learningWpm: Gauge,
    @InjectMetric('typing_product_learning_accuracy_percent') private readonly learningAccuracy: Gauge,
    @InjectMetric('typing_product_learning_wpm_outcome_percent') private readonly learningOutcomes: Gauge,
    @InjectMetric('typing_product_learning_accuracy_outcome_percent')
    private readonly learningAccuracyOutcomes: Gauge,
    @InjectMetric('typing_product_learning_sample_size') private readonly learningSamples: Gauge,
  ) {
    const configured = this.config.get<number>('PRODUCT_ANALYTICS_REFRESH_SECONDS', 900);
    this.analyticsRefreshMs = Math.min(3_600_000, Math.max(300_000, configured * 1000));
  }

  onModuleInit() {
    void this.refresh();
    const configured = this.config.get<number>('PRODUCT_METRICS_REFRESH_SECONDS', 60);
    const refreshMs = Math.min(900_000, Math.max(60_000, configured * 1000));
    this.timer = setInterval(() => void this.refresh(), refreshMs);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async refresh() {
    const now = new Date();
    try {
      await Promise.all(
        WINDOWS.map(async ({ label, milliseconds }) => {
          const since = new Date(now.getTime() - milliseconds);
          const activeWhere = {
            OR: [
              { lastLoginAt: { gte: since } },
              { practiceSessions: { some: { createdAt: { gte: since } } } },
              { lessonAttempts: { some: { createdAt: { gte: since } } } },
            ],
          };
          const [active, created, recurring] = await Promise.all([
            this.prisma.user.count({ where: activeWhere }),
            this.prisma.user.count({ where: { createdAt: { gte: since } } }),
            this.prisma.user.count({ where: { ...activeWhere, createdAt: { lt: since } } }),
          ]);
          this.activeUsers.labels(label).set(active);
          this.newUsers.labels(label).set(created);
          this.recurringUsers.labels(label).set(recurring);
        }),
      );

      if (now.getTime() - this.lastAnalyticsAt >= this.analyticsRefreshMs) {
        await this.refreshAnalytics(now);
        this.lastAnalyticsAt = now.getTime();
      }
      this.lastRefresh.setToCurrentTime();
    } catch (error) {
      this.logger.warn(
        `No se actualizaron métricas de producto: ${error instanceof Error ? error.name : 'UnknownError'}`,
      );
    }
  }

  private async refreshAnalytics(now: Date) {
    await Promise.all([this.refreshCountryMetrics(now), this.refreshRetention(now), this.refreshLearning()]);
  }

  private normalizeCountry(value: string | null): string {
    return value && COUNTRY_CODE_SET.has(value) ? value : 'unknown';
  }

  private async refreshCountryMetrics(now: Date) {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [users, active, registrations, practices] = await Promise.all([
      this.prisma.$queryRaw<CountRow[]>`
        SELECT country_code, COUNT(*)::bigint AS value FROM users GROUP BY country_code`,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT country_code, COUNT(*)::bigint AS value
        FROM users u
        WHERE u.last_login_at >= ${since}
          OR EXISTS (SELECT 1 FROM practice_sessions ps WHERE ps.user_id = u.id AND ps.created_at >= ${since})
          OR EXISTS (SELECT 1 FROM lesson_attempts la WHERE la.user_id = u.id AND la.created_at >= ${since})
        GROUP BY country_code`,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT country_code, COUNT(*)::bigint AS value FROM users WHERE created_at >= ${since} GROUP BY country_code`,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT u.country_code, COUNT(*)::bigint AS value
        FROM practice_sessions ps JOIN users u ON u.id = ps.user_id
        WHERE ps.created_at >= ${since} GROUP BY u.country_code`,
    ]);

    this.countryEvents.reset();
    for (const [scope, rows] of [
      ['users', users],
      ['active_24h', active],
      ['registrations_24h', registrations],
      ['practices_24h', practices],
    ] as const) {
      for (const row of rows) this.countryEvents.labels(scope, this.normalizeCountry(row.country_code)).set(asNumber(row.value));
    }
  }

  private async refreshRetention(now: Date) {
    for (const days of RETENTION_DAYS) {
      const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const cohortStart = new Date(todayUtc.getTime() - (days + 1) * 86_400_000);
      const cohortEnd = new Date(cohortStart.getTime() + 86_400_000);
      const activityEnd = new Date(cohortEnd.getTime() + days * 86_400_000);
      const [row] = await this.prisma.$queryRaw<RetentionRow[]>`
        SELECT COUNT(*)::bigint AS cohort_size,
          COUNT(*) FILTER (WHERE
            u.last_login_at >= ${activityEnd} - INTERVAL '1 day' AND u.last_login_at < ${activityEnd}
            OR EXISTS (SELECT 1 FROM practice_sessions ps WHERE ps.user_id = u.id AND ps.created_at >= ${activityEnd} - INTERVAL '1 day' AND ps.created_at < ${activityEnd})
            OR EXISTS (SELECT 1 FROM lesson_attempts la WHERE la.user_id = u.id AND la.created_at >= ${activityEnd} - INTERVAL '1 day' AND la.created_at < ${activityEnd})
          )::bigint AS retained_size
        FROM users u WHERE u.created_at >= ${cohortStart} AND u.created_at < ${cohortEnd}`;
      const cohortSize = asNumber(row?.cohort_size ?? 0);
      const label = `D${days}`;
      if (cohortSize === 0) {
        this.retention.remove(label);
        this.retentionCohort.remove(label);
        continue;
      }
      this.retention.labels(label).set((100 * asNumber(row.retained_size)) / cohortSize);
      this.retentionCohort.labels(label).set(cohortSize);
    }
  }

  private async refreshLearning() {
    this.learningWpm.reset();
    this.learningAccuracy.reset();
    this.learningOutcomes.reset();
    this.learningAccuracyOutcomes.reset();
    this.learningSamples.reset();
    for (const segmentType of ['all', 'language', 'layout'] as const) {
      const segment = segmentType === 'all'
        ? Prisma.raw("'all'")
        : segmentType === 'language'
          ? Prisma.raw('latest_language')
          : Prisma.raw('latest_layout');
      const groupBy = segmentType === 'all' ? Prisma.empty : Prisma.sql` GROUP BY ${segment}`;
      const rows = await this.prisma.$queryRaw<LearningRow[]>(Prisma.sql`
        WITH ordered AS (
          SELECT ps.user_id, ps.language_code::text AS language_code, COALESCE(ps.layout_id, 'unknown') AS layout_id,
            ps.net_wpm::double precision AS net_wpm, ps.accuracy::double precision AS accuracy,
            ROW_NUMBER() OVER (PARTITION BY ps.user_id ORDER BY ps.created_at, ps.id) AS first_rank,
            ROW_NUMBER() OVER (PARTITION BY ps.user_id ORDER BY ps.created_at DESC, ps.id DESC) AS recent_rank,
            COUNT(*) OVER (PARTITION BY ps.user_id) AS practice_count
          FROM practice_sessions ps
          WHERE ps.net_wpm IS NOT NULL AND ps.accuracy IS NOT NULL
        ), per_user AS (
          SELECT user_id,
            MAX(net_wpm) FILTER (WHERE first_rank = 1) AS initial_wpm,
            MAX(net_wpm) FILTER (WHERE recent_rank = 1) AS recent_wpm,
            MAX(accuracy) FILTER (WHERE first_rank = 1) AS initial_accuracy,
            MAX(accuracy) FILTER (WHERE recent_rank = 1) AS recent_accuracy,
            MAX(language_code) FILTER (WHERE recent_rank = 1) AS latest_language,
            MAX(layout_id) FILTER (WHERE recent_rank = 1) AS latest_layout
          FROM ordered WHERE practice_count >= 2 GROUP BY user_id
        )
        SELECT ${segment} AS segment, COUNT(*)::bigint AS sample_size,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY initial_wpm) AS initial_wpm,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY recent_wpm) AS recent_wpm,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY recent_wpm - initial_wpm) AS delta_wpm,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY initial_accuracy) AS initial_accuracy,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY recent_accuracy) AS recent_accuracy,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY recent_accuracy - initial_accuracy) AS delta_accuracy,
          100 * AVG(CASE WHEN recent_wpm - initial_wpm > 1 THEN 1.0 ELSE 0.0 END) AS improved_percent,
          100 * AVG(CASE WHEN ABS(recent_wpm - initial_wpm) <= 1 THEN 1.0 ELSE 0.0 END) AS stable_percent,
          100 * AVG(CASE WHEN recent_wpm - initial_wpm < -1 THEN 1.0 ELSE 0.0 END) AS declined_percent,
          100 * AVG(CASE WHEN recent_accuracy - initial_accuracy > 1 THEN 1.0 ELSE 0.0 END) AS improved_accuracy_percent,
          100 * AVG(CASE WHEN ABS(recent_accuracy - initial_accuracy) <= 1 THEN 1.0 ELSE 0.0 END) AS stable_accuracy_percent,
          100 * AVG(CASE WHEN recent_accuracy - initial_accuracy < -1 THEN 1.0 ELSE 0.0 END) AS declined_accuracy_percent
        FROM per_user${groupBy}`);
      for (const row of rows) {
        const rawSegment = row.segment ?? 'unknown';
        const safeSegment = segmentType === 'language'
          ? (PRACTICE_LANGUAGES.has(rawSegment) ? rawSegment : 'unknown')
          : segmentType === 'layout'
            ? (SUPPORTED_LAYOUT_IDS.has(rawSegment) ? rawSegment : 'unknown')
            : 'all';
        this.learningSamples.labels(segmentType, safeSegment).set(asNumber(row.sample_size));
        for (const [stat, value] of [['initial', row.initial_wpm], ['recent', row.recent_wpm], ['delta', row.delta_wpm]] as const) {
          this.learningWpm.labels(segmentType, safeSegment, stat).set(asNumber(value));
        }
        for (const [stat, value] of [['initial', row.initial_accuracy], ['recent', row.recent_accuracy], ['delta', row.delta_accuracy]] as const) {
          this.learningAccuracy.labels(segmentType, safeSegment, stat).set(asNumber(value));
        }
        for (const [outcome, value] of [['improved', row.improved_percent], ['stable', row.stable_percent], ['declined', row.declined_percent]] as const) {
          this.learningOutcomes.labels(segmentType, safeSegment, outcome).set(asNumber(value));
        }
        for (const [outcome, value] of [
          ['improved', row.improved_accuracy_percent],
          ['stable', row.stable_accuracy_percent],
          ['declined', row.declined_accuracy_percent],
        ] as const) {
          this.learningAccuracyOutcomes.labels(segmentType, safeSegment, outcome).set(asNumber(value));
        }
      }
    }
  }
}
