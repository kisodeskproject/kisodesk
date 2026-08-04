// src/practice/practice.service.ts
import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { LanguageCode, Prisma } from '@prisma/client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

import { PrismaService } from '../prisma/prisma.service';
import { ErrorTrackingService } from '../errors/error-tracking.service';
import { ProgressService } from '../progress/progress.service';
import { SavePracticeDto } from './dto/save-practice.dto';
import { DerivedTelemetry, TelemetryService } from './telemetry.service';
import { SUPPORTED_LAYOUT_IDS } from './keyboard-layout-catalog';
import { getFallbackPracticeText, getRandomPracticeText } from './practice-texts';
import { buildAdaptiveExercise } from './adaptive-prioritizer';
import { GetGuestAdaptiveExerciseDto } from './dto/get-guest-adaptive-exercise.dto';

type PracticeSessionSelect = {
  id: string;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  createdAt: Date;
  timeElapsed: number;
  languageCode: LanguageCode;
};

function buildFinalErrorSummary(derived: DerivedTelemetry) {
  return {
    totalKeystrokes: derived.totalFinalInputs,
    totalErrors: derived.uncorrectedErrors,
    keys: Array.from(derived.keyStats.entries()).map(([expected, value]) => ({
      expected,
      totalPresses: value.presses,
      totalErrors: value.errors,
    })),
  };
}

@Injectable()
export class PracticeService {
  constructor(
    private prisma: PrismaService,
    private errorTracking: ErrorTrackingService,
    private progressService: ProgressService,
    private telemetryService: TelemetryService,
    @InjectMetric('typing_practice_sessions_completed_total')
    private readonly practiceSessionsCounter: Counter,
    @InjectMetric('typing_practice_results_persisted_total')
    private readonly practiceResultsPersistedCounter: Counter,
    @InjectMetric('typing_practice_result_duplicates_total')
    private readonly practiceResultDuplicatesCounter: Counter,
    @InjectMetric('typing_practice_result_rejected_total')
    private readonly practiceResultRejectedCounter: Counter,
    @InjectMetric('typing_practice_result_errors_total')
    private readonly practiceResultErrorsCounter: Counter,
    @Optional()
    @InjectMetric('typing_practice_duration_seconds')
    private readonly practiceDurationHistogram?: Histogram,
    @Optional()
    @InjectMetric('typing_practice_net_wpm')
    private readonly practiceNetWpmHistogram?: Histogram,
    @Optional()
    @InjectMetric('typing_practice_accuracy_percent')
    private readonly practiceAccuracyHistogram?: Histogram,
  ) {}

  private validatePractice(dto: SavePracticeDto) {
    if (dto.netWpm < 0 || dto.netWpm > 250) {
      throw new BadRequestException('netWpm debe estar entre 0 y 250');
    }
    if (dto.grossWpm < 0 || dto.grossWpm > 300) {
      throw new BadRequestException('grossWpm debe estar entre 0 y 300');
    }
    if (dto.accuracy < 0 || dto.accuracy > 100) {
      throw new BadRequestException('accuracy debe estar entre 0 y 100');
    }
    if (dto.timeElapsed < 1 || dto.timeElapsed > 3600) {
      throw new BadRequestException('timeElapsed debe estar entre 1 y 3600 segundos');
    }
    if (
      !dto.errorSummary ||
      dto.errorSummary.totalKeystrokes < 1 ||
      dto.errorSummary.keys.length === 0
    ) {
      throw new BadRequestException('errorSummary es obligatorio y no puede estar vacío');
    }
  }

  private async updateRankingCache(
    prisma: Prisma.TransactionClient,
    userId: string,
    rankingScope: string,
  ) {
    const whereClause: Prisma.PracticeSessionWhereInput =
      rankingScope === 'global' ? { userId } : { userId, localeCode: rankingScope };
    const sessions = await prisma.practiceSession.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, netWpm: true, grossWpm: true, accuracy: true, createdAt: true },
    });

    if (sessions.length === 0) return;

    const bestSession = [...sessions].sort(
      (left, right) =>
        right.netWpm - left.netWpm ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    )[0];

    await prisma.userRankingCache.upsert({
      where: { userId_languageCode: { userId, languageCode: rankingScope } },
      update: {
        bestWpmNet: bestSession.netWpm,
        bestGrossWpm: bestSession.grossWpm,
        bestAccuracy: bestSession.accuracy,
        bestAchievedAt: bestSession.createdAt,
        bestSessionId: bestSession.id,
        totalSessionsUsed: sessions.length,
      },
      create: {
        userId,
        languageCode: rankingScope,
        bestWpmNet: bestSession.netWpm,
        bestGrossWpm: bestSession.grossWpm,
        bestAccuracy: bestSession.accuracy,
        bestAchievedAt: bestSession.createdAt,
        bestSessionId: bestSession.id,
        totalSessionsUsed: sessions.length,
      },
    });
  }

  private async updateBestGrossWpm(
    prisma: Prisma.TransactionClient,
    userId: string,
    newGrossWpm: number,
  ) {
    await prisma.user.updateMany({
      where: {
        id: userId,
        OR: [{ bestGrossWpm: null }, { bestGrossWpm: { lt: newGrossWpm } }],
      },
      data: { bestGrossWpm: newGrossWpm },
    });
  }

  async savePractice(userId: string, dto: SavePracticeDto) {
    const source = dto.source === 'guest_sync' ? 'guest_sync' : 'direct';
    try {
    if (dto.layoutId && !SUPPORTED_LAYOUT_IDS.has(dto.layoutId))
      throw new BadRequestException('layoutId no soportado');
    if (dto.telemetry) this.validateTelemetry(dto.telemetry);
    const derived = dto.telemetry ? this.telemetryService.derive(dto.telemetry) : null;
    if (derived) {
      dto.timeElapsed = Math.max(1, Math.round(derived.activeDurationMs / 1000));
      dto.grossWpm = Math.round(derived.grossWpm);
      dto.netWpm = Math.round(derived.effectiveWpm);
      dto.accuracy = Math.round(derived.finalAccuracy);
      dto.errorSummary = buildFinalErrorSummary(derived);
    }
    this.validatePractice(dto);

    const practice = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))
      `;
      const duplicate = dto.clientSessionId
        ? await tx.practiceSession.findUnique({
            where: { userId_clientSessionId: { userId, clientSessionId: dto.clientSessionId } },
          })
        : null;
      if (duplicate) return { practice: duplicate, created: false };
      const existingPracticeText = dto.textId
        ? await tx.practiceText.findUnique({
            where: { id: dto.textId },
            select: { id: true },
          })
        : null;
      if (dto.telemetry && existingPracticeText) {
        const text = await tx.practiceText.findUnique({
          where: { id: existingPracticeText.id },
          select: { content: true },
        });
        if (text && text.content.normalize('NFC') !== dto.telemetry.text.normalize('NFC')) {
          throw new BadRequestException('La telemetría no corresponde al texto de práctica');
        }
      }

      const savedPractice = await tx.practiceSession.create({
        data: {
          userId,
          netWpm: dto.netWpm,
          grossWpm: dto.grossWpm,
          accuracy: dto.accuracy,
          timeElapsed: dto.timeElapsed,
          languageCode: dto.language,
          localeCode: dto.locale ?? 'es-latam',
          layoutId: dto.layoutId ?? null,
          practiceTextId: existingPracticeText?.id ?? null,
          telemetryVersion: dto.telemetry?.version,
          telemetry: (dto.telemetry as unknown as Prisma.InputJsonValue) ?? undefined,
          derivedMetrics: derived
            ? ({
                ...derived,
                keyStats: Object.fromEntries(derived.keyStats),
                bigramStats: Array.from(derived.bigramStats.values()),
                keyErrors: Object.fromEntries(derived.keyErrors),
                bigramErrors: Object.fromEntries(derived.bigramErrors),
              } as Prisma.InputJsonValue)
            : undefined,
          clientSessionId: dto.clientSessionId,
        },
      });

      await this.errorTracking.processPracticeErrorsInTransaction(tx, userId, savedPractice.id, {
        netWpm: dto.netWpm,
        grossWpm: dto.grossWpm,
        accuracy: dto.accuracy,
        timeElapsed: dto.timeElapsed,
        languageCode: dto.language,
        localeCode: dto.locale ?? 'es-latam',
        errorSummary: dto.errorSummary,
      });

      await this.progressService.recordPracticeTimeInTransaction(
        tx,
        userId,
        dto.timeElapsed,
        new Date(),
        dto.locale ?? 'es-latam',
      );
      if (derived)
        await this.telemetryService.persistAggregates(
          tx,
          userId,
          dto.language,
          dto.layoutId ?? 'unknown',
          derived,
        );
      await this.updateRankingCache(tx, userId, dto.locale ?? 'es-latam');
      await this.updateRankingCache(tx, userId, 'global');
      await this.updateBestGrossWpm(tx, userId, dto.grossWpm);

      return { practice: savedPractice, created: true };
    });

    if (!practice.created) {
      this.practiceResultDuplicatesCounter.labels(source).inc();
      return { id: practice.practice.id, savedAt: practice.practice.createdAt.toISOString(), result: 'duplicate' as const };
    }

    const layoutLabel = dto.layoutId ?? 'unknown';
    this.practiceSessionsCounter.labels('true', dto.language, layoutLabel).inc();
    this.practiceResultsPersistedCounter.labels(source).inc();
    this.practiceDurationHistogram?.labels(dto.language, layoutLabel).observe(dto.timeElapsed);
    this.practiceNetWpmHistogram?.labels(dto.language, layoutLabel).observe(dto.netWpm);
    this.practiceAccuracyHistogram?.labels(dto.language, layoutLabel).observe(dto.accuracy);

    return {
      id: practice.practice.id,
      savedAt: practice.practice.createdAt.toISOString(),
      result: 'created' as const,
    };
    } catch (error) {
      if (error instanceof BadRequestException) {
        this.practiceResultRejectedCounter.labels(source, 'invalid_content').inc();
      } else {
        this.practiceResultErrorsCounter.labels(source, 'persistence').inc();
      }
      throw error;
    }
  }

  private validateTelemetry(telemetry: NonNullable<SavePracticeDto['telemetry']>) {
    if (telemetry.events.length > 20_000)
      throw new BadRequestException('Demasiados eventos de telemetría');
    if (telemetry.events.length === 0)
      throw new BadRequestException('La telemetría no puede estar vacía');
    let previousSequence = -1;
    let previousTimestamp = telemetry.startedAt ?? telemetry.events[0].timestamp;
    const graphemes = Array.from(telemetry.text.normalize('NFC'));
    for (const event of telemetry.events) {
      if (event.sequence !== previousSequence + 1 || event.timestamp < previousTimestamp) {
        throw new BadRequestException('La secuencia de telemetría no es válida');
      }
      if (event.timestamp - previousTimestamp > 24 * 60 * 60 * 1000) {
        throw new BadRequestException('La telemetría excede la duración permitida');
      }
      if (
        event.kind === 'input' &&
        (event.position >= graphemes.length ||
          event.expected?.normalize('NFC') !== graphemes[event.position])
      ) {
        throw new BadRequestException('Los eventos no corresponden al texto de práctica');
      }
      previousSequence = event.sequence;
      previousTimestamp = event.timestamp;
    }
    if (
      telemetry.pausedMs >
      previousTimestamp - (telemetry.startedAt ?? telemetry.events[0].timestamp)
    ) {
      throw new BadRequestException('pausedMs no es válido');
    }
  }

  async getStats(userId: string) {
    return this.getStatsForUser(userId);
  }

  async getStatsForUser(userId: string) {
    const sessions = (await this.prisma.practiceSession.findMany({
      where: { userId },
      select: {
        netWpm: true,
        accuracy: true,
        timeElapsed: true,
        languageCode: true,
      },
    })) as PracticeSessionSelect[];

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageNetWpm: 0,
        averageAccuracy: 0,
        bestNetWpm: 0,
        totalTimeElapsed: 0,
        byLanguage: [],
      };
    }

    const totalSessions = sessions.length;
    const totalNetWpm = sessions.reduce(
      (sum: number, s: PracticeSessionSelect) => sum + s.netWpm,
      0,
    );
    const totalAccuracy = sessions.reduce(
      (sum: number, s: PracticeSessionSelect) => sum + s.accuracy,
      0,
    );
    const totalTime = sessions.reduce(
      (sum: number, s: PracticeSessionSelect) => sum + s.timeElapsed,
      0,
    );
    const bestNetWpm = Math.max(...sessions.map((s: PracticeSessionSelect) => s.netWpm));

    const averageNetWpm = Math.round(totalNetWpm / totalSessions);
    const averageAccuracy = parseFloat((totalAccuracy / totalSessions).toFixed(1));

    const languageMap = new Map<
      LanguageCode,
      { total: number; sumWpm: number; sumAccuracy: number }
    >();
    for (const s of sessions) {
      const lang = s.languageCode;
      const existing = languageMap.get(lang);
      if (existing) {
        existing.total++;
        existing.sumWpm += s.netWpm;
        existing.sumAccuracy += s.accuracy;
      } else {
        languageMap.set(lang, { total: 1, sumWpm: s.netWpm, sumAccuracy: s.accuracy });
      }
    }
    const byLanguage = Array.from(languageMap.entries()).map(([lang, data]) => ({
      language: lang,
      totalSessions: data.total,
      averageNetWpm: Math.round(data.sumWpm / data.total),
      averageAccuracy: parseFloat((data.sumAccuracy / data.total).toFixed(1)),
    }));

    return {
      totalSessions,
      averageNetWpm,
      averageAccuracy,
      bestNetWpm,
      totalTimeElapsed: totalTime,
      byLanguage,
    };
  }

  async getRandomText(language: LanguageCode, excludedIds: string[] = []) {
    const safeExcludedIds = excludedIds.slice(0, 100);
    const texts = await this.prisma.practiceText.findMany({
      where: { languageCode: language },
      select: { id: true, content: true },
    });
    if (texts.length === 0) {
      const fallbackText = getFallbackPracticeText(language, safeExcludedIds);
      return { id: fallbackText.id, text: fallbackText.content };
    }
    const selected = getRandomPracticeText(texts, safeExcludedIds);
    return { id: selected.id, text: selected.content };
  }

  async getNextAdaptiveExercise(
    userId: string,
    language: LanguageCode,
    layoutId: string,
    mode: 'words' | 'text',
  ) {
    const [keyStats, bigramStats, recentSessions, texts] = await Promise.all([
      this.prisma.keyLayoutStat.findMany({
        where: { userId, languageCode: language, layoutId },
      }),
      this.prisma.bigramStat.findMany({
        where: {
          userId,
          languageCode: language,
          layoutId,
        },
        orderBy: [{ totalErrors: 'desc' }, { averageLatencyMs: 'desc' }],
        take: 30,
      }),
      this.prisma.practiceSession.findMany({
        where: { userId, languageCode: language, layoutId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { accuracy: true, netWpm: true, createdAt: true },
      }),
      this.prisma.practiceText.findMany({
        where: { languageCode: language },
        select: {
          id: true,
          content: true,
          difficulty: true,
          characterSet: true,
          wordIndex: true,
          bigramIndex: true,
        },
      }),
    ]);

    const averageAccuracy = recentSessions.length
      ? recentSessions.reduce((sum, item) => sum + item.accuracy, 0) / recentSessions.length
      : null;
    return buildAdaptiveExercise({ language, layoutId, mode, keyStats, bigramStats, texts: texts.length ? texts : [getFallbackPracticeText(language)], sampleSessions: recentSessions.length, averageAccuracy });
  }

  async getGuestAdaptiveExercise(dto: GetGuestAdaptiveExerciseDto) {
    const profile = dto.profile;
    if (!SUPPORTED_LAYOUT_IDS.has(profile.layoutId)) throw new BadRequestException('layoutId no soportado');
    const toStats = (source: Record<string, unknown>, kind: 'key' | 'bigram') => {
      const entries = Object.entries(source);
      if (entries.length > 256) throw new BadRequestException('Demasiadas estadísticas adaptativas');
      return entries.map(([value, raw]) => {
        if (!raw || typeof raw !== 'object') throw new BadRequestException('Estadística adaptativa inválida');
        const stat = raw as Record<string, unknown>;
        const fields = ['attempts', 'errors', 'latencyTotalMs', 'latencySamples', 'recurrence'];
        if (!fields.every((field) => Number.isInteger(stat[field]) && Number(stat[field]) >= 0 && Number(stat[field]) <= 1_000_000) || Number(stat.errors) > Number(stat.attempts) || Number(stat.latencySamples) > Number(stat.attempts)) throw new BadRequestException('Estadística adaptativa inválida');
        if ((kind === 'key' && [...value].length !== 1) || (kind === 'bigram' && [...value].length !== 2)) throw new BadRequestException('Clave adaptativa inválida');
        return kind === 'key'
          ? { keyChar: value, totalPresses: Number(stat.attempts), totalErrors: Number(stat.errors), averageLatencyMs: Number(stat.latencySamples) ? Number(stat.latencyTotalMs) / Number(stat.latencySamples) : 0 }
          : { firstChar: [...value][0], secondChar: [...value][1], totalPresses: Number(stat.attempts), totalErrors: Number(stat.errors), averageLatencyMs: Number(stat.latencySamples) ? Number(stat.latencyTotalMs) / Number(stat.latencySamples) : 0 };
      });
    };
    const [keyStats, bigramStats, texts] = await Promise.all([
      Promise.resolve(toStats(profile.keyStats, 'key')),
      Promise.resolve(toStats(profile.bigramStats, 'bigram')),
      this.prisma.practiceText.findMany({ where: { languageCode: profile.language }, select: { id: true, content: true } }),
    ]);
    return buildAdaptiveExercise({ language: profile.language, layoutId: profile.layoutId, mode: dto.mode === 'text' ? 'text' : 'words', keyStats, bigramStats, texts: texts.length ? texts : [getFallbackPracticeText(profile.language)], sampleSessions: profile.sampleSessions, averageAccuracy: profile.sampleSessions ? profile.finalAccuracy : null });
  }
}
