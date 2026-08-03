import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

import { PrismaService } from '../prisma/prisma.service';

const MODELS = new Set([
  'User', 'Course', 'Lesson', 'CourseLesson', 'UserLessonProgress', 'LessonAttempt',
  'PracticeDay', 'TypingError', 'ErrorSession', 'PracticeSession', 'PracticeText',
  'KeyStat', 'BigramStat', 'KeyLayoutStat', 'RefreshToken', 'PasswordResetToken', 'UserRankingCache',
  'UserPresence', 'Friendship',
]);
const OPERATIONS = new Set([
  'findMany', 'findUnique', 'findFirst', 'create', 'createMany', 'update', 'updateMany',
  'delete', 'deleteMany', 'aggregate', 'count', 'upsert', 'groupBy',
]);

@Injectable()
export class PrismaMetricsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @InjectMetric('typing_prisma_query_duration_seconds') private readonly duration: Histogram,
    @InjectMetric('typing_prisma_queries_total') private readonly queries: Counter,
    @InjectMetric('typing_prisma_query_errors_total') private readonly errors: Counter,
  ) {}

  onModuleInit() {
    for (const model of MODELS) this.wrapDelegate(model);
  }

  private wrapDelegate(model: string) {
    const delegateName = `${model[0].toLowerCase()}${model.slice(1)}`;
    const delegate = (this.prisma as unknown as Record<string, Record<string, unknown>>)[delegateName];
    if (!delegate) return;

    for (const operation of OPERATIONS) {
      const original = delegate[operation];
      if (typeof original !== 'function') continue;
      delegate[operation] = async (...args: unknown[]) => {
        const startedAt = process.hrtime.bigint();
        try {
          return await (original as (...input: unknown[]) => unknown).apply(delegate, args);
        } catch (error) {
          this.errors.labels(model, operation).inc();
          throw error;
        } finally {
          this.duration.labels(model, operation).observe(
            Number(process.hrtime.bigint() - startedAt) / 1_000_000_000,
          );
          this.queries.labels(model, operation).inc();
        }
      };
    }
  }
}
