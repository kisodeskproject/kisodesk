import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const USED_PASSWORD_RESET_RETENTION_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class TokenCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenCleanupService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.cleanupExpiredTokens(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async cleanupExpiredTokens(): Promise<void> {
    if (this.running) return;

    this.running = true;
    const now = new Date();
    const usedBefore = new Date(now.getTime() - USED_PASSWORD_RESET_RETENTION_MS);

    try {
      const [refreshTokens, expiredResetTokens, usedResetTokens] = await this.prisma.$transaction(
        async (tx) =>
          Promise.all([
            tx.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
            tx.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
            tx.passwordResetToken.deleteMany({
              where: {
                usedAt: { not: null, lt: usedBefore },
                expiresAt: { gte: now },
              },
            }),
          ]),
      );

      this.logger.log(
        `Token cleanup completed: refresh=${refreshTokens.count}, resetExpired=${expiredResetTokens.count}, resetUsed=${usedResetTokens.count}`,
      );
    } finally {
      this.running = false;
    }
  }
}
