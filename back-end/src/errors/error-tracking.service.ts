// src/errors/error-tracking.service.ts
import { Injectable } from '@nestjs/common';
import { LanguageCode } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ErrorSummaryDto } from './dto/error-summary.dto';

type KeystrokeInput = {
  key: string;
  expected: string;
  correct: boolean;
};

type ErrorSessionInput = {
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  timeElapsed: number;
  languageCode: LanguageCode;
  localeCode: string;
  errorSummary: ErrorSummaryDto;
};

@Injectable()
export class ErrorTrackingService {
  constructor(private prisma: PrismaService) {}

  async processLessonErrors(userId: string, lessonId: string, data: ErrorSessionInput) {
    await this.prisma.$transaction((tx) =>
      this.processLessonErrorsInTransaction(tx, userId, lessonId, data),
    );
  }

  async processPracticeErrors(userId: string, practiceSessionId: string, data: ErrorSessionInput) {
    await this.prisma.$transaction((tx) =>
      this.processPracticeErrorsInTransaction(tx, userId, practiceSessionId, data),
    );
  }

  async processLessonErrorsInTransaction(
    tx: any,
    userId: string,
    lessonId: string,
    data: ErrorSessionInput,
  ) {
    await tx.errorSession.create({
      data: {
        userId,
        lessonId,
        type: 'LESSON',
        duration: data.timeElapsed,
        totalKeystrokes: data.errorSummary.totalKeystrokes,
        totalErrors: data.errorSummary.totalErrors,
        netWpm: data.netWpm,
        grossWpm: data.grossWpm,
        accuracy: data.accuracy,
      },
    });

    await this.upsertKeyStatsFromSummary(
      tx,
      userId,
      data.languageCode,
      data.localeCode,
      data.errorSummary,
    );
  }

  async processPracticeErrorsInTransaction(
    tx: any,
    userId: string,
    practiceSessionId: string,
    data: ErrorSessionInput,
  ) {
    await tx.errorSession.create({
      data: {
        userId,
        practiceSessionId,
        type: 'PRACTICE',
        duration: data.timeElapsed,
        totalKeystrokes: data.errorSummary.totalKeystrokes,
        totalErrors: data.errorSummary.totalErrors,
        netWpm: data.netWpm,
        grossWpm: data.grossWpm,
        accuracy: data.accuracy,
      },
    });

    await this.upsertKeyStatsFromSummary(
      tx,
      userId,
      data.languageCode,
      data.localeCode,
      data.errorSummary,
    );
  }

  createSummaryFromKeystrokes(keystrokes: KeystrokeInput[]): ErrorSummaryDto {
    const map = new Map<string, { totalPresses: number; totalErrors: number }>();

    for (const keystroke of keystrokes) {
      const key = keystroke.expected;
      const current = map.get(key) ?? { totalPresses: 0, totalErrors: 0 };
      current.totalPresses += 1;
      if (!keystroke.correct) current.totalErrors += 1;
      map.set(key, current);
    }

    const keys = Array.from(map.entries()).map(([expected, stats]) => ({
      expected,
      totalPresses: stats.totalPresses,
      totalErrors: stats.totalErrors,
    }));

    return {
      totalKeystrokes: keystrokes.length,
      totalErrors: keys.reduce((sum, key) => sum + key.totalErrors, 0),
      keys,
    };
  }

  private async upsertKeyStatsFromSummary(
    tx: any,
    userId: string,
    languageCode: LanguageCode,
    localeCode: string,
    summary: ErrorSummaryDto,
  ) {
    const normalizedKeys = new Map<string, { totalPresses: number; totalErrors: number }>();
    for (const key of summary.keys) {
      const expected = key.expected;
      const current = normalizedKeys.get(expected) ?? { totalPresses: 0, totalErrors: 0 };
      current.totalPresses += key.totalPresses;
      current.totalErrors += key.totalErrors;
      normalizedKeys.set(expected, current);
    }

    for (const [expected, key] of normalizedKeys) {
      const totalPresses = key.totalPresses;
      const totalErrors = key.totalErrors;
      const errorRate = totalPresses > 0 ? (totalErrors / totalPresses) * 100 : 0;

      await tx.$executeRaw`
        INSERT INTO "key_stats" (
          "user_id", "language_code", "locale_code", "key_char",
          "total_presses", "total_errors", "error_rate", "last_error_at", "updated_at"
        )
        VALUES (
          ${userId}, ${languageCode}::"LanguageCode", ${localeCode}, ${expected},
          ${totalPresses}, ${totalErrors}, ${errorRate},
          CASE WHEN ${totalErrors} > 0 THEN NOW() ELSE NULL END,
          NOW()
        )
        ON CONFLICT ("user_id", "language_code", "locale_code", "key_char")
        DO UPDATE SET
          "total_presses" = "key_stats"."total_presses" + ${totalPresses},
          "total_errors" = "key_stats"."total_errors" + ${totalErrors},
          "error_rate" = CASE
            WHEN ("key_stats"."total_presses" + ${totalPresses}) > 0
            THEN (("key_stats"."total_errors" + ${totalErrors})::float / ("key_stats"."total_presses" + ${totalPresses})::float) * 100
            ELSE 0
          END,
          "last_error_at" = CASE
            WHEN ${totalErrors} > 0 THEN NOW()
            ELSE "key_stats"."last_error_at"
          END,
          "updated_at" = NOW()
      `;
    }
  }
}
