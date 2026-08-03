// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

// Extrae el token de la cookie 'access_token'
const cookieExtractor = (req: any): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'] ?? null;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>('API_JWT_SECRET', ''),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; ver?: number; authTime?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        sessionVersion: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Cuenta inexistente o eliminada');
    }
    if ((payload.ver ?? 0) !== user.sessionVersion) {
      throw new UnauthorizedException('Sesión revocada');
    }

    if (!payload.authTime || !Number.isSafeInteger(payload.authTime)) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const { sessionVersion: _, ...authenticatedUser } = user;
    return { ...authenticatedUser, authTime: payload.authTime };
  }
}
