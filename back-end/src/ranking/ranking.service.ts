// src/ranking/ranking.service.ts
import { Injectable } from '@nestjs/common';
import { SUPPORTED_INTERFACE_LOCALES } from '../practice/dto/save-practice.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene el ranking de usuarios basado en la caché para el idioma solicitado.
   * @param language locale de interfaz o 'global' (por defecto 'global')
   * @param limit número máximo de usuarios a devolver (1-100, default 20)
   * @param offset número de usuarios a saltar (default 0)
   */
  async getRanking(language?: string, limit?: number, offset?: number) {
    const cacheLanguage = this.resolveCacheLanguage(language);
    const take = Number.isInteger(limit) && limit! >= 1 && limit! <= 100 ? limit! : 20;
    const skip = Number.isInteger(offset) && offset! >= 0 ? offset! : 0;

    const visibleRankingWhere = {
      where: {
        languageCode: cacheLanguage,
        user: {
          showInRanking: true,
          publicAlias: { not: null },
        },
      },
    };

    const [total, cacheRows, distribution] = await Promise.all([
      this.prisma.userRankingCache.count(visibleRankingWhere),
      this.prisma.userRankingCache.findMany({
        ...visibleRankingWhere,
        include: {
          user: {
            select: {
              id: true,
              publicAlias: true,
            },
          },
        },
        orderBy: [
          { bestWpmNet: 'desc' },
          { bestAchievedAt: 'asc' },
          { userId: 'asc' },
        ],
        skip,
        take,
      }),
      this.prisma.userRankingCache.findMany({
        ...visibleRankingWhere,
        select: {
          bestWpmNet: true,
          bestAccuracy: true,
        },
      }),
    ]);

    const ranking = cacheRows.map((row) => ({
      id: row.user.id,
      name: row.user.publicAlias!,
      bestWpmNet: row.bestWpmNet,
      score: this.getScore(row.bestWpmNet),
      bestGrossWpm: row.bestGrossWpm,
      bestAccuracy: row.bestAccuracy,
      bestAchievedAt: row.bestAchievedAt.toISOString(),
      level: this.getLevel(row.bestWpmNet),
      language: cacheLanguage === 'global' ? 'global' : cacheLanguage,
    }));

    return {
      ranking,
      distribution: distribution.map((row) => ({ wpm: row.bestWpmNet, accuracy: row.bestAccuracy })),
      total,
      limit: take,
      offset: skip,
    };
  }

  /**
   * Obtiene las estadísticas del usuario autenticado para el idioma solicitado.
   * @param userId ID del usuario
   * @param language locale de interfaz o 'global' (por defecto 'global')
   */
  async getUserStats(userId: string, language?: string) {
    const cacheLanguage = this.resolveCacheLanguage(language);

    const [userCache, user, recentSessions] = await Promise.all([
      this.prisma.userRankingCache.findUnique({
        where: { userId_languageCode: { userId, languageCode: cacheLanguage } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { showInRanking: true, publicAlias: true },
      }),
      this.prisma.practiceSession.findMany({
        where:
          cacheLanguage === 'global' ? { userId } : { userId, localeCode: cacheLanguage },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { netWpm: true, grossWpm: true, accuracy: true },
      }),
    ]);

    const recentAverage = this.getRecentAverage(recentSessions);

    if (!userCache || userCache.totalSessionsUsed === 0) {
      return {
        bestWpmNet: 0,
        score: 0,
        bestGrossWpm: 0,
        bestAccuracy: 0,
        bestAchievedAt: null,
        level: 'bronze',
        rank: 0,
        topPercent: 0,
        insufficientData: true,
        recentAverage,
      };
    }

    const bestWpmNet = userCache.bestWpmNet;
    const bestGrossWpm = userCache.bestGrossWpm;
    const bestAccuracy = userCache.bestAccuracy;
    const level = this.getLevel(bestWpmNet);

    if (!user?.showInRanking || !user.publicAlias) {
      return {
        bestWpmNet,
        score: this.getScore(bestWpmNet),
        bestGrossWpm,
        bestAccuracy,
        bestAchievedAt: userCache.bestAchievedAt.toISOString(),
        level,
        rank: 0,
        topPercent: 0,
        insufficientData: false,
        rankingVisible: false,
        recentAverage,
      };
    }

    const validCaches = await this.prisma.userRankingCache.findMany({
      where: {
        languageCode: cacheLanguage,
        user: {
          showInRanking: true,
          publicAlias: { not: null },
        },
      },
      select: { userId: true, bestWpmNet: true, bestAchievedAt: true },
      orderBy: [
        { bestWpmNet: 'desc' },
        { bestAchievedAt: 'asc' },
        { userId: 'asc' },
      ],
    });

    const userValid = validCaches.some((c) => c.userId === userId);
    if (!userValid) {
      return {
        bestWpmNet,
        score: this.getScore(bestWpmNet),
        bestGrossWpm,
        bestAccuracy,
        bestAchievedAt: userCache.bestAchievedAt.toISOString(),
        level,
        rank: 0,
        topPercent: 0,
        insufficientData: true,
        recentAverage,
      };
    }

    const rank = validCaches.findIndex((cache) => cache.userId === userId) + 1;
    const totalUsers = validCaches.length;

    let topPercent: number;
    if (totalUsers <= 1) {
      topPercent = 0;
    } else {
      topPercent = ((rank - 1) / (totalUsers - 1)) * 100;
      topPercent = Math.round(topPercent * 10) / 10;
      if (topPercent < 0.1) topPercent = 0.1;
    }

    return {
      bestWpmNet,
      score: this.getScore(bestWpmNet),
      bestGrossWpm,
      bestAccuracy,
      bestAchievedAt: userCache.bestAchievedAt.toISOString(),
      level,
      rank,
      topPercent,
      insufficientData: false,
      rankingVisible: true,
      recentAverage,
    };
  }

  private resolveCacheLanguage(language?: string): string {
    if (!language || language === 'global') return 'global';
    if (SUPPORTED_INTERFACE_LOCALES.includes(language as (typeof SUPPORTED_INTERFACE_LOCALES)[number]))
      return language;
    return 'global';
  }

  private getLevel(wpm: number): 'bronze' | 'silver' | 'gold' {
    if (wpm >= 80) return 'gold';
    if (wpm >= 60) return 'silver';
    return 'bronze';
  }

  private getScore(bestWpmNet: number): number {
    return bestWpmNet * 100;
  }

  private getRecentAverage(
    sessions: Array<{ netWpm: number; grossWpm: number; accuracy: number }>,
  ): { score: number; wpm: number; grossWpm: number; accuracy: number } | null {
    if (sessions.length === 0) return null;

    const avgNetWpm = Math.round(
      sessions.reduce((sum, s) => sum + s.netWpm, 0) / sessions.length,
    );
    const avgGrossWpm = Math.round(
      sessions.reduce((sum, s) => sum + s.grossWpm, 0) / sessions.length,
    );
    const avgAccuracy = Math.round(
      sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length,
    );

    return {
      score: this.getScore(avgNetWpm),
      wpm: avgNetWpm,
      grossWpm: avgGrossWpm,
      accuracy: avgAccuracy,
    };
  }
}
