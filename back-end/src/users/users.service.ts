// src/users/users.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, Prisma, Role, LanguageCode, LayoutCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createUniquePublicAlias } from './public-alias.util';
import { GOOGLE_REAUTH_MAX_AGE_SECONDS } from '../auth/auth-session.config';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  interfaceLanguage: true,
  countryCode: true,
  layout: true,
  accessibility: true,
  publicAlias: true,
  showInRanking: true,
  searchableByAlias: true,
  showPresenceToFriends: true,
  shareStatsWithFriends: true,
  allowFriendRequests: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
};

type UserUpdateData = {
  email?: string;
  name?: string;
  role?: Role;
  interfaceLanguage?: LanguageCode;
  layout?: LayoutCode;
  countryCode?: string | null;
  accessibility?: Prisma.InputJsonValue;
  publicAlias?: string | null;
  showInRanking?: boolean;
  searchableByAlias?: boolean;
  showPresenceToFriends?: boolean;
  shareStatsWithFriends?: boolean;
  allowFriendRequests?: boolean;
  passwordHash?: string;
};

type CourseProgressLesson = {
  lessonId: string;
  lessonOrder: number;
  lessonTitle: string | null;
  bestNetWpm: number;
  bestGrossWpm: number;
  bestAccuracy: number;
  achievedAt: Date;
};

type CourseProgressSummary = {
  courseId: string;
  courseName: string;
  languageCode: LanguageCode;
  lessons: CourseProgressLesson[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const publicAlias = await createUniquePublicAlias(this.prisma, dto.name || dto.email);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role ?? Role.USER,
        interfaceLanguage: dto.interfaceLanguage,
        layout: dto.layout,
        accessibility: dto.accessibility as Prisma.InputJsonValue | undefined,
        publicAlias,
        showInRanking: true,
        searchableByAlias: true,
        showPresenceToFriends: true,
        shareStatsWithFriends: true,
        allowFriendRequests: true,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    const data: UserUpdateData = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.interfaceLanguage !== undefined) data.interfaceLanguage = dto.interfaceLanguage;
    if (dto.layout !== undefined) data.layout = dto.layout;
    if (dto.accessibility !== undefined) {
      data.accessibility = dto.accessibility as Prisma.InputJsonValue;
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  async exportMyData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authProvider: true,
        interfaceLanguage: true,
        language: true,
        countryCode: true,
        countryName: true,
        layout: true,
        accessibility: true,
        bestGrossWpm: true,
        publicAlias: true,
        showInRanking: true,
        searchableByAlias: true,
        showPresenceToFriends: true,
        shareStatsWithFriends: true,
        allowFriendRequests: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        lessonProgress: {
          orderBy: { achievedAt: 'asc' },
          select: {
            id: true,
            lessonId: true,
            bestNetWpm: true,
            bestGrossWpm: true,
            bestAccuracy: true,
            timeElapsed: true,
            bestScore: true,
            achievedAt: true,
            status: true,
            attemptsCount: true,
            successfulAttempts: true,
            latestNetWpm: true,
            latestAccuracy: true,
            bestQualifiedNetWpm: true,
            masteredAt: true,
            nextReviewAt: true,
            createdAt: true,
            updatedAt: true,
            lesson: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        lessonAttempts: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            lessonId: true,
            netWpm: true,
            grossWpm: true,
            accuracy: true,
            timeElapsed: true,
            qualified: true,
            usedAssistance: true,
            physicalEvents: true,
            createdAt: true,
          },
        },
        practiceSessions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            netWpm: true,
            grossWpm: true,
            accuracy: true,
            timeElapsed: true,
            languageCode: true,
            layoutId: true,
            practiceTextId: true,
            keystrokes: true,
            createdAt: true,
          },
        },
        typingErrors: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            lessonId: true,
            practiceSessionId: true,
            expectedChar: true,
            typedChar: true,
            position: true,
            createdAt: true,
          },
        },
        errorSessions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            lessonId: true,
            practiceSessionId: true,
            type: true,
            duration: true,
            totalKeystrokes: true,
            totalErrors: true,
            netWpm: true,
            grossWpm: true,
            accuracy: true,
            createdAt: true,
          },
        },
        keyStats: {
          orderBy: [{ languageCode: 'asc' }, { keyChar: 'asc' }],
          select: {
            languageCode: true,
            keyChar: true,
            totalPresses: true,
            totalErrors: true,
            errorRate: true,
            lastErrorAt: true,
            updatedAt: true,
          },
        },
        rankingCache: {
          select: {
            languageCode: true,
            bestWpmNet: true,
            bestGrossWpm: true,
            bestAccuracy: true,
            bestAchievedAt: true,
            bestSessionId: true,
            totalSessionsUsed: true,
            updatedAt: true,
          },
        },
        presence: {
          select: {
            lastSeenAt: true,
            updatedAt: true,
          },
        },
        friendshipsSent: {
          select: {
            id: true,
            status: true,
            acceptedAt: true,
            createdAt: true,
            updatedAt: true,
            addressee: {
              select: {
                id: true,
              },
            },
          },
        },
        friendshipsReceived: {
          select: {
            id: true,
            status: true,
            acceptedAt: true,
            createdAt: true,
            updatedAt: true,
            requester: {
              select: {
                id: true,
              },
            },
          },
        },
        refreshTokens: {
          orderBy: { createdAt: 'asc' },
          select: {
            createdAt: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      account: user,
    };
  }

  async removeMe(userId: string, dto: DeleteMeDto, authTime: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        passwordHash: true,
        authProvider: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.confirmationEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException('El correo de confirmación no coincide');
    }

    if (user.authProvider === AuthProvider.PASSWORD) {
      if (
        !user.passwordHash ||
        !(await bcrypt.compare(dto.currentPassword ?? '', user.passwordHash))
      ) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }
    } else if (user.authProvider === AuthProvider.GOOGLE) {
      const authAgeSeconds = Math.floor(Date.now() / 1000) - authTime;
      if (
        !Number.isSafeInteger(authTime) ||
        authAgeSeconds < 0 ||
        authAgeSeconds > GOOGLE_REAUTH_MAX_AGE_SECONDS
      ) {
        throw new ForbiddenException({
          code: 'GOOGLE_REAUTH_REQUIRED',
          message: 'Reautenticación con Google requerida',
        });
      }
    } else {
      throw new UnauthorizedException('Proveedor de autenticación no compatible');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        publicAlias: true,
        showInRanking: true,
        searchableByAlias: true,
        showPresenceToFriends: true,
        shareStatsWithFriends: true,
        allowFriendRequests: true,
      },
    });
    if (!currentUser) throw new NotFoundException('Usuario no encontrado');

    const data: UserUpdateData = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.interfaceLanguage !== undefined) data.interfaceLanguage = dto.interfaceLanguage;
    if (dto.layout !== undefined) data.layout = dto.layout;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.accessibility !== undefined) {
      data.accessibility = dto.accessibility as Prisma.InputJsonValue;
    }
    if (dto.publicAlias !== undefined) {
      data.publicAlias = dto.publicAlias === null ? null : dto.publicAlias.trim().toLowerCase();
    }
    if (dto.showInRanking !== undefined) data.showInRanking = dto.showInRanking;
    if (dto.searchableByAlias !== undefined) data.searchableByAlias = dto.searchableByAlias;
    if (dto.showPresenceToFriends !== undefined) {
      data.showPresenceToFriends = dto.showPresenceToFriends;
    }
    if (dto.shareStatsWithFriends !== undefined) {
      data.shareStatsWithFriends = dto.shareStatsWithFriends;
    }
    if (dto.allowFriendRequests !== undefined) {
      data.allowFriendRequests = dto.allowFriendRequests;
    }

    const hasPublicFeatureEnabled =
      (dto.showInRanking ?? currentUser.showInRanking) ||
      (dto.searchableByAlias ?? currentUser.searchableByAlias) ||
      (dto.showPresenceToFriends ?? currentUser.showPresenceToFriends) ||
      (dto.shareStatsWithFriends ?? currentUser.shareStatsWithFriends) ||
      (dto.allowFriendRequests ?? currentUser.allowFriendRequests);
    const effectivePublicAlias =
      data.publicAlias !== undefined ? data.publicAlias : currentUser.publicAlias;
    if (hasPublicFeatureEnabled && !effectivePublicAlias) {
      throw new BadRequestException(
        'Configura un alias público antes de activar funciones sociales',
      );
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    try {
      if (dto.updatedAt) {
        const updated = await this.prisma.user.updateMany({
          where: { id: userId, updatedAt: new Date(dto.updatedAt) },
          data,
        });
        if (updated.count === 0) {
          throw new ConflictException(
            'El perfil cambió en otra pestaña. Recarga los datos e inténtalo de nuevo.',
          );
        }
        return await this.prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: USER_SELECT,
        });
      }

      return await this.prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('El alias público ya está en uso');
      }
      throw error;
    }
  }

  async getProgress(userId: string) {
    const progress = await this.prisma.userLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            courseLessons: {
              include: { course: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });

    const coursesMap = new Map<string, CourseProgressSummary>();
    for (const p of progress) {
      const courseLesson = p.lesson?.courseLessons?.[0];
      if (!courseLesson) continue;
      const course = courseLesson.course;

      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          courseId: course.id,
          courseName: course.name,
          languageCode: course.languageCode,
          lessons: [],
        });
      }

      coursesMap.get(course.id)!.lessons.push({
        lessonId: p.lessonId,
        lessonOrder: courseLesson.order,
        lessonTitle: p.lesson.title,
        bestNetWpm: p.bestNetWpm,
        bestGrossWpm: p.bestGrossWpm,
        bestAccuracy: p.bestAccuracy,
        achievedAt: p.achievedAt,
      });
    }

    return Array.from(coursesMap.values());
  }

  /** Datos para el heatmap de errores del usuario usando KeyStats */
  async getHeatmap(userId: string) {
    const stats = await this.prisma.keyStat.findMany({
      where: { userId },
      select: {
        languageCode: true,
        keyChar: true,
        totalErrors: true,
      },
      orderBy: [{ languageCode: 'asc' }, { totalErrors: 'desc' }],
    });

    const heatmap: Record<string, Record<string, number>> = {};
    for (const s of stats) {
      if (!heatmap[s.languageCode]) heatmap[s.languageCode] = {};
      heatmap[s.languageCode][s.keyChar] = s.totalErrors;
    }
    return heatmap;
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authProvider: true,
        layout: true,
        interfaceLanguage: true,
        accessibility: true,
        publicAlias: true,
        showInRanking: true,
        searchableByAlias: true,
        showPresenceToFriends: true,
        shareStatsWithFriends: true,
        allowFriendRequests: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      accessibility: user.accessibility,
      publicAlias: user.publicAlias,
      showInRanking: user.showInRanking,
      searchableByAlias: user.searchableByAlias,
      showPresenceToFriends: user.showPresenceToFriends,
      shareStatsWithFriends: user.shareStatsWithFriends,
      allowFriendRequests: user.allowFriendRequests,
      layout: user.layout,
      interfaceLanguage: user.interfaceLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async getWeakKeys(
    userId: string,
    language?: LanguageCode,
    limit: number = 5,
    days?: number,
    locale?: string,
  ) {
    const dateFilter: Prisma.KeyStatWhereInput = {};
    if (days && days > 0) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      dateFilter.updatedAt = { gte: sinceDate };
    }

    const keyStats = await this.prisma.keyStat.findMany({
      where: {
        userId,
        languageCode: language || undefined,
        localeCode: locale || undefined,
        totalPresses: { gt: 0 },
        ...dateFilter,
      },
      orderBy: { errorRate: 'desc' },
      take: limit,
    });

    if (keyStats.length === 0) {
      return { weakKeys: [], summary: null, insufficientData: true };
    }

    const totalPresses = keyStats.reduce((sum, k) => sum + k.totalPresses, 0);

    if (totalPresses < 50) {
      return { weakKeys: [], summary: null, insufficientData: true };
    }

    const overallStats = await this.prisma.keyStat.aggregate({
      where: {
        userId,
        languageCode: language || undefined,
        localeCode: locale || undefined,
        totalPresses: { gt: 0 },
        ...dateFilter,
      },
      _sum: { totalPresses: true, totalErrors: true },
    });

    const overallTotal = overallStats._sum.totalPresses ?? 0;
    const overallErrors = overallStats._sum.totalErrors ?? 0;
    const overallAccuracy =
      overallTotal > 0 ? ((overallTotal - overallErrors) / overallTotal) * 100 : 0;

    const weakKeys = keyStats.map((k) => ({
      key: k.keyChar,
      totalAttempts: k.totalPresses,
      correctAttempts: k.totalPresses - k.totalErrors,
      accuracy: parseFloat((100 - k.errorRate).toFixed(1)),
      commonMistakes: [] as string[],
    }));

    const weakestKey = weakKeys.length > 0 ? weakKeys[0].key : null;
    const weakestAccuracy = weakKeys.length > 0 ? weakKeys[0].accuracy : null;

    return {
      weakKeys,
      summary: {
        overallAccuracy: parseFloat(overallAccuracy.toFixed(1)),
        weakestKey,
        weakestAccuracy,
      },
      insufficientData: false,
    };
  }
}
