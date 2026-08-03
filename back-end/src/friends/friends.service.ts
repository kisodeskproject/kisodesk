import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PracticeService } from '../practice/practice.service';

type FriendshipRow = {
  id: string;
  requesterId: string;
  addresseeId: string;
  requesterAlias: string | null;
  addresseeAlias: string | null;
  requesterPresenceVisible: boolean;
  addresseePresenceVisible: boolean;
  requesterStatsVisible: boolean;
  addresseeStatsVisible: boolean;
  requesterLastSeenAt: Date | null;
  addresseeLastSeenAt: Date | null;
  status: string;
  acceptedAt: Date | null;
  createdAt: Date;
};

type FriendCard = {
  id: string;
  name: string;
  online: boolean;
  lastSeenAt: Date | null;
  presenceVisible: boolean;
  statsVisible: boolean;
  friendshipId: string;
  acceptedAt: Date | null;
  practiceStats: Awaited<ReturnType<PracticeService['getStatsForUser']>> | null;
};

type FriendRequestCard = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
};

type SearchResultCard = {
  id: string;
  name: string;
  friendshipStatus: 'none' | 'pending_outgoing' | 'pending_incoming' | 'friends';
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly practiceService: PracticeService,
  ) {}

  private isOnline(lastSeenAt: Date | null): boolean {
    if (!lastSeenAt) return false;
    return Date.now() - lastSeenAt.getTime() <= ONLINE_WINDOW_MS;
  }

  private getPublicName(alias: string | null, userId: string): string {
    return alias ?? `user-${userId.slice(0, 8)}`;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        publicAlias: true,
        allowFriendRequests: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  private async getRelationship(userId: string, friendId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; requesterId: string; addresseeId: string; status: string }>
    >(Prisma.sql`
      SELECT id, requester_id AS "requesterId", addressee_id AS "addresseeId", status
      FROM friendships
      WHERE (requester_id = ${userId} AND addressee_id = ${friendId})
         OR (requester_id = ${friendId} AND addressee_id = ${userId})
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  async pingPresence(userId: string) {
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO user_presence (user_id, last_seen_at, updated_at)
      VALUES (${userId}, NOW(), NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at, updated_at = NOW()
    `);

    return { ok: true };
  }

  async sendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('No puedes agregarte a ti mismo');
    }

    const pairKey = [userId, friendId].sort().join(':');

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${pairKey}, 0))`,
      );
      const target = await tx.user.findUnique({
        where: { id: friendId },
        select: { id: true, publicAlias: true, allowFriendRequests: true },
      });
      if (!target) throw new NotFoundException('Usuario no encontrado');
      if (!target.allowFriendRequests || !target.publicAlias) {
        throw new ForbiddenException('Este usuario no acepta solicitudes de amistad');
      }
      const relationships = await tx.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, addresseeId: friendId },
            { requesterId: friendId, addresseeId: userId },
          ],
        },
        select: { id: true, status: true },
      });
      const relationship = relationships[0];
      if (relationship?.status === 'BLOCKED') {
        throw new ForbiddenException('No se puede crear esta relación');
      }
      if (relationship?.status === 'ACCEPTED') {
        throw new BadRequestException('Ya son amigos');
      }
      if (relationship?.status === 'PENDING') {
        throw new ConflictException({ code: 'FRIEND_REQUEST_PENDING', message: 'Ya existe una solicitud pendiente' });
      }
      if (relationship?.status === 'REJECTED') {
        await tx.friendship.delete({ where: { id: relationship.id } });
      }
      try {
        const request = await tx.friendship.create({
          data: { requesterId: userId, addresseeId: friendId, status: 'PENDING' },
          select: { id: true },
        });
        return { id: request.id };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException({ code: 'FRIEND_REQUEST_PENDING', message: 'Ya existe una solicitud pendiente' });
        }
        throw error;
      }
    });
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE friendships
      SET status = 'ACCEPTED',
          accepted_at = NOW(),
          updated_at = NOW()
      WHERE id = ${requestId}
        AND addressee_id = ${userId}
        AND status = 'PENDING'
      RETURNING id
    `);

    if (!request[0]) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return { id: request[0].id };
  }

  async rejectRequest(userId: string, requestId: string) {
    const request = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE friendships
      SET status = 'REJECTED',
          updated_at = NOW()
      WHERE id = ${requestId}
        AND addressee_id = ${userId}
        AND status = 'PENDING'
      RETURNING id
    `);

    if (!request[0]) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return { id: request[0].id };
  }

  async removeFriend(userId: string, friendId: string) {
    const result = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM friendships
      WHERE (
        (
          requester_id = ${userId} AND addressee_id = ${friendId}
        ) OR (
          requester_id = ${friendId} AND addressee_id = ${userId}
        )
      )
        AND status = 'ACCEPTED'
      RETURNING id
    `);

    if (!result[0]) {
      throw new NotFoundException('Relación no encontrada');
    }

    return { id: result[0].id };
  }

  async blockUser(userId: string, blockedUserId: string) {
    if (userId === blockedUserId) {
      throw new BadRequestException('No puedes bloquearte a ti mismo');
    }

    await this.ensureUserExists(blockedUserId);
    await this.prisma.$transaction([
      this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: userId, addresseeId: blockedUserId },
            { requesterId: blockedUserId, addresseeId: userId },
          ],
        },
      }),
      this.prisma.friendship.create({
        data: {
          requesterId: userId,
          addresseeId: blockedUserId,
          status: 'BLOCKED',
        },
        select: { id: true },
      }),
    ]);

    return { id: blockedUserId };
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const result = await this.prisma.friendship.deleteMany({
      where: {
        requesterId: userId,
        addresseeId: blockedUserId,
        status: 'BLOCKED',
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Bloqueo no encontrado');
    }

    return { id: blockedUserId };
  }

  async listBlockedUsers(userId: string) {
    const rows = await this.prisma.friendship.findMany({
      where: { requesterId: userId, status: 'BLOCKED' },
      select: {
        addressee: {
          select: {
            id: true,
            publicAlias: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      users: rows.map(({ addressee }) => ({
        id: addressee.id,
        name: this.getPublicName(addressee.publicAlias, addressee.id),
      })),
    };
  }

  async listFriends(userId: string) {
    const rows = await this.prisma.$queryRaw<FriendshipRow[]>(Prisma.sql`
      SELECT
        f.id,
        f.requester_id AS "requesterId",
        f.addressee_id AS "addresseeId",
        f.status,
        f.accepted_at AS "acceptedAt",
        f.created_at AS "createdAt",
        requester.public_alias AS "requesterAlias",
        requester.show_presence_to_friends AS "requesterPresenceVisible",
        requester.share_stats_with_friends AS "requesterStatsVisible",
        addressee.public_alias AS "addresseeAlias",
        addressee.show_presence_to_friends AS "addresseePresenceVisible",
        addressee.share_stats_with_friends AS "addresseeStatsVisible",
        requester_presence.last_seen_at AS "requesterLastSeenAt",
        addressee_presence.last_seen_at AS "addresseeLastSeenAt"
      FROM friendships f
      JOIN users requester ON requester.id = f.requester_id
      JOIN users addressee ON addressee.id = f.addressee_id
      LEFT JOIN user_presence requester_presence ON requester_presence.user_id = requester.id
      LEFT JOIN user_presence addressee_presence ON addressee_presence.user_id = addressee.id
      WHERE f.status = 'ACCEPTED'
        AND (f.requester_id = ${userId} OR f.addressee_id = ${userId})
      ORDER BY COALESCE(f.accepted_at, f.created_at) DESC
    `);

    const friends = await Promise.all(
      rows.map(async (row) => {
        const isRequester = row.requesterId === userId;
        const friendId = isRequester ? row.addresseeId : row.requesterId;
        const friendAlias = isRequester ? row.addresseeAlias : row.requesterAlias;
        const presenceVisible = isRequester
          ? row.addresseePresenceVisible
          : row.requesterPresenceVisible;
        const statsVisible = isRequester ? row.addresseeStatsVisible : row.requesterStatsVisible;
        const rawLastSeenAt = isRequester ? row.addresseeLastSeenAt : row.requesterLastSeenAt;
        const friendLastSeenAt = presenceVisible ? rawLastSeenAt : null;

        return {
          id: friendId,
          name: this.getPublicName(friendAlias, friendId),
          online: presenceVisible && this.isOnline(friendLastSeenAt),
          lastSeenAt: friendLastSeenAt,
          presenceVisible,
          statsVisible,
          friendshipId: row.id,
          acceptedAt: row.acceptedAt,
          practiceStats: statsVisible ? await this.practiceService.getStatsForUser(friendId) : null,
        } satisfies FriendCard;
      }),
    );

    return { friends };
  }

  async listRequests(userId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        requesterId: string;
        addresseeId: string;
        requesterAlias: string | null;
        addresseeAlias: string | null;
        createdAt: Date;
      }>
    >(Prisma.sql`
      SELECT
        f.id,
        f.requester_id AS "requesterId",
        f.addressee_id AS "addresseeId",
        f.created_at AS "createdAt",
        requester.public_alias AS "requesterAlias",
        addressee.public_alias AS "addresseeAlias"
      FROM friendships f
      JOIN users requester ON requester.id = f.requester_id
      JOIN users addressee ON addressee.id = f.addressee_id
      WHERE f.status = 'PENDING'
        AND (f.requester_id = ${userId} OR f.addressee_id = ${userId})
      ORDER BY f.created_at DESC
    `);

    const incoming = rows
      .filter((row) => row.addresseeId === userId)
      .map(
        (row) =>
          ({
            id: row.id,
            userId: row.requesterId,
            name: this.getPublicName(row.requesterAlias, row.requesterId),
            createdAt: row.createdAt,
          }) satisfies FriendRequestCard,
      );

    const outgoing = rows
      .filter((row) => row.requesterId === userId)
      .map(
        (row) =>
          ({
            id: row.id,
            userId: row.addresseeId,
            name: this.getPublicName(row.addresseeAlias, row.addresseeId),
            createdAt: row.createdAt,
          }) satisfies FriendRequestCard,
      );

    return { incoming, outgoing };
  }

  async getFriendPracticeStats(userId: string, friendId: string) {
    if (userId === friendId) {
      return this.practiceService.getStatsForUser(friendId);
    }

    const relationship = await this.getRelationship(userId, friendId);
    if (!relationship || relationship.status !== 'ACCEPTED') {
      throw new ForbiddenException('Solo puedes ver las estadísticas de tus amigos');
    }

    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: { shareStatsWithFriends: true },
    });
    if (!friend?.shareStatsWithFriends) {
      throw new ForbiddenException('Este usuario no comparte sus estadísticas');
    }

    return this.practiceService.getStatsForUser(friendId);
  }

  async searchUsers(userId: string, query: string, limit = 10) {
    const search = query.trim();
    if (search.length < 3) {
      return { users: [] };
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        publicAlias: string;
      }>
    >(Prisma.sql`
      SELECT u.id, u.public_alias AS "publicAlias"
      FROM users u
      WHERE u.id <> ${userId}
        AND u.searchable_by_alias = true
        AND u.public_alias IS NOT NULL
        AND u.public_alias ILIKE ${`%${search}%`}
        AND NOT EXISTS (
          SELECT 1
          FROM friendships blocked
          WHERE blocked.status = 'BLOCKED'
            AND (
              (blocked.requester_id = ${userId} AND blocked.addressee_id = u.id)
              OR (blocked.requester_id = u.id AND blocked.addressee_id = ${userId})
            )
        )
      ORDER BY u.public_alias ASC
      LIMIT ${Math.min(Math.max(limit, 1), 20)}
    `);

    const results = await Promise.all(
      rows.map(async (row) => {
        const relationship = await this.getRelationship(userId, row.id);
        const friendshipStatus: SearchResultCard['friendshipStatus'] =
          relationship?.status === 'ACCEPTED'
            ? 'friends'
            : relationship?.status === 'PENDING' && relationship.requesterId === userId
              ? 'pending_outgoing'
              : relationship?.status === 'PENDING'
                ? 'pending_incoming'
                : 'none';

        return {
          id: row.id,
          name: row.publicAlias,
          friendshipStatus,
        } satisfies SearchResultCard;
      }),
    );

    return { users: results };
  }
}
