// src/progress/progress.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SUPPORTED_INTERFACE_LOCALES } from '../practice/dto/save-practice.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  private getUtcDayStart(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  async recordPracticeTimeInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    seconds: number,
    occurredAt = new Date(),
    localeCode = 'es-latam',
  ) {
    const totalSeconds = Math.floor(seconds);
    if (!Number.isFinite(totalSeconds) || totalSeconds < 1) return;

    const date = this.getUtcDayStart(occurredAt);
    await tx.practiceDay.upsert({
      where: { userId_date_localeCode: { userId, date, localeCode } },
      update: { totalSeconds: { increment: totalSeconds } },
      create: { userId, date, localeCode, totalSeconds },
    });
  }

  private getLocale(locale?: string): string {
    return SUPPORTED_INTERFACE_LOCALES.includes(locale as never) ? locale! : 'es-latam';
  }

  async getCalendar(userId: string, locale?: string) {
    const localeCode = this.getLocale(locale);
    const days = await this.prisma.practiceDay.findMany({
      where: { userId, localeCode },
      orderBy: { date: 'asc' },
      select: { date: true, totalSeconds: true },
    });

    return {
      days: days.map((day) => ({
        date: day.date.toISOString().split('T')[0],
        minutes: Math.ceil(day.totalSeconds / 60),
      })),
    };
  }

  async getProgress(userId: string, locale?: string) {
    const localeCode = this.getLocale(locale);
    // Total de lecciones
    const totalLessons = await this.prisma.lesson.count();

    // Progreso del usuario en lecciones
    const userProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId, localeCode },
      orderBy: { achievedAt: 'asc' },
      include: { lesson: { select: { type: true } } },
    });

    const completedLessonIds = new Set(
      userProgress
        .filter((progress) => progress.status === 'COMPLETED' || progress.status === 'MASTERED')
        .map((progress) => progress.lessonId),
    );
    const completedLessons = completedLessonIds.size;
    const practiceProgress = userProgress.filter((progress) => progress.lesson.type === 'practice');

    // Calcular cursos completados
    const courses = await this.prisma.course.findMany({
      include: {
        courseLessons: {
          select: { lessonId: true },
        },
      },
    });

    let completedCourses = 0;
    for (const course of courses) {
      const lessonIds = course.courseLessons.map((cl) => cl.lessonId);
      if (lessonIds.length > 0 && lessonIds.every((id) => completedLessonIds.has(id))) {
        completedCourses++;
      }
    }

    let averageWpm = 0;
    let averageAccuracy = 0;
    let totalPracticeTime = 0;
    let bestWpm = 0;
    let bestAccuracy = 0;

    const practiceTimeAggregate = await this.prisma.practiceDay.aggregate({
      where: { userId, localeCode },
      _sum: { totalSeconds: true },
    });
    totalPracticeTime = practiceTimeAggregate._sum.totalSeconds ?? 0;

    const freePracticeSessions = await this.prisma.practiceSession.findMany({
      where: { userId, localeCode },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        netWpm: true,
        accuracy: true,
        createdAt: true,
      },
    });

    if (freePracticeSessions.length > 0) {
      const sumWpm = freePracticeSessions.reduce((acc, s) => acc + s.netWpm, 0);
      const sumAccuracy = freePracticeSessions.reduce((acc, s) => acc + s.accuracy, 0);
      averageWpm = Math.round(sumWpm / freePracticeSessions.length);
      averageAccuracy = parseFloat((sumAccuracy / freePracticeSessions.length).toFixed(1));
    }

    if (practiceProgress.length > 0) {
      bestWpm = Math.max(...practiceProgress.map((p) => p.bestQualifiedNetWpm));
      bestAccuracy = Math.max(...practiceProgress.map((p) => p.bestAccuracy));
    }

    // Obtener todas las sesiones de práctica (unificadas) para rachas y gráficos
    const allPracticeSessions = await this.prisma.practiceSession.findMany({
      where: { userId, localeCode },
      orderBy: { createdAt: 'asc' },
      select: {
        netWpm: true,
        accuracy: true,
        createdAt: true,
      },
    });

    // Preparar achievements con wpm y accuracy (combinando lecciones y prácticas)
    const allAchievements = [
      ...practiceProgress.map((p) => ({
        date: p.achievedAt,
        wpm: p.bestQualifiedNetWpm,
        accuracy: p.bestAccuracy,
      })),
      ...allPracticeSessions.map((s) => ({
        date: s.createdAt,
        wpm: s.netWpm,
        accuracy: s.accuracy,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const weeklyProgress = this.getWeeklyProgress(allAchievements);
    const weeklyAccuracy = this.getWeeklyAccuracy(allAchievements);
    const monthlyProgress = this.getMonthlyProgress(allAchievements);
    const { currentStreak } = this.calculateStreaks(allAchievements.map((a) => a.date));

    const totalKeystrokes = null;

    const userStats = {
      bestWpm,
      bestAccuracy,
      totalKeystrokes,
      streak: currentStreak,
    };

    return {
      stats: {
        totalLessons,
        completedLessons,
        completedCourses,
        averageWpm,
        averageAccuracy,
        totalPracticeTime,
        weeklyProgress,
        weeklyAccuracy,
        monthlyProgress,
      },
      userStats,
    };
  }

  private getRecentDailySeries(
    achievements: { date: Date; value: number }[],
    days: number,
    decimalPlaces = 0,
  ) {
    const today = this.getUtcDayStart(new Date());
    const dates = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - (days - 1 - index));
      return date;
    });
    const totals = new Map<string, { sum: number; count: number }>();

    for (const achievement of achievements) {
      const key = this.getUtcDayStart(achievement.date).toISOString().slice(0, 10);
      const current = totals.get(key) ?? { sum: 0, count: 0 };
      current.sum += achievement.value;
      current.count += 1;
      totals.set(key, current);
    }

    return {
      labels: dates.map((date) => date.toISOString().slice(8, 10)),
      values: dates.map((date) => {
        const aggregate = totals.get(date.toISOString().slice(0, 10));
        if (!aggregate) return 0;
        const average = aggregate.sum / aggregate.count;
        return decimalPlaces ? Number(average.toFixed(decimalPlaces)) : Math.round(average);
      }),
    };
  }

  private getWeeklyProgress(achievements: { date: Date; wpm: number }[]) {
    return this.getRecentDailySeries(
      achievements.map((achievement) => ({ date: achievement.date, value: achievement.wpm })),
      7,
    );
  }

  private getWeeklyAccuracy(achievements: { date: Date; accuracy: number }[]) {
    return this.getRecentDailySeries(
      achievements.map((achievement) => ({ date: achievement.date, value: achievement.accuracy })),
      7,
      1,
    );
  }

  private getMonthlyProgress(achievements: { date: Date; wpm: number }[]) {
    return this.getRecentDailySeries(
      achievements.map((achievement) => ({ date: achievement.date, value: achievement.wpm })),
      30,
    );
  }

  private calculateStreaks(dates: Date[]) {
    if (!dates.length) return { currentStreak: 0, bestStreak: 0 };

    const uniqueDays = new Set<string>();
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      uniqueDays.add(dateStr);
    }
    const sortedDates = Array.from(uniqueDays)
      .sort()
      .map((d) => new Date(d));

    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays =
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 3600 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        bestStreak = Math.max(bestStreak, streak);
        streak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, streak);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let current = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const day = new Date(sortedDates[i]);
      day.setHours(0, 0, 0, 0);
      const diff = (today.getTime() - day.getTime()) / (1000 * 3600 * 24);
      if (diff === current) {
        current++;
      } else {
        break;
      }
    }
    currentStreak = current;

    return { currentStreak, bestStreak };
  }
}
