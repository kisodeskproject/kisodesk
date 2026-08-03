// src/auth/services/auth.service.ts
import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { PasswordResetMailService } from './password-reset-mail.service';
import { createUniquePublicAlias } from '../../users/public-alias.util';
import type { AuthRedirectLocale } from '../auth-redirect-locale';
import { GOOGLE_OAUTH_STATE_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../auth-session.config';

export type GoogleAuthIntent = 'login' | 'delete-account';

type GoogleOAuthState = {
  purpose: 'google-oauth';
  lang: AuthRedirectLocale;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  intent: GoogleAuthIntent;
};

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private passwordResetMail: PasswordResetMailService,
    private authRateLimit: AuthRateLimitService,
    @InjectMetric('typing_registrations_total')
    private readonly registrationsCounter: Counter,
    @InjectMetric('typing_logins_total')
    private readonly loginsCounter: Counter,
    @Optional()
    @InjectMetric('typing_login_failures_total')
    private readonly loginFailuresCounter?: Counter,
    @Optional()
    @InjectMetric('typing_password_reset_requests_total')
    private readonly passwordResetRequestsCounter?: Counter,
    @Optional()
    @InjectMetric('typing_password_reset_completed_total')
    private readonly passwordResetCompletedCounter?: Counter,
    @Optional()
    @InjectMetric('typing_password_reset_email_failed_total')
    private readonly passwordResetEmailFailedCounter?: Counter,
    @Optional()
    @InjectMetric('typing_auth_events_total')
    private readonly authEventsCounter?: Counter,
  ) {}

  private recordAuthEvent(
    event: 'login' | 'registration' | 'password_reset_request' | 'password_reset_email' | 'password_reset_complete',
    provider: 'password' | 'google' | 'email' | 'unknown',
    outcome: 'success' | 'failure' | 'requested',
    reason: 'none' | 'duplicate' | 'invalid_credentials' | 'unknown_email' | 'delivery_error' | 'invalid_or_expired' | 'reused',
  ) {
    this.authEventsCounter?.labels(event, provider, outcome, reason).inc();
  }

  private generateRefreshToken(): string {
    return randomBytes(40).toString('hex');
  }

  private generatePasswordResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getGoogleRedirectUri(): string {
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');

    if (!redirectUri) {
      throw new BadRequestException('GOOGLE_REDIRECT_URI no configurado');
    }

    return redirectUri;
  }

  private signAccessToken(
    user: {
      id: string;
      email: string;
      role: Role;
      sessionVersion: number;
    },
    authenticatedAt: Date,
  ): string {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      ver: user.sessionVersion,
      authTime: Math.floor(authenticatedAt.getTime() / 1000),
    });
  }

  private async createAuthTokens(
    user: {
      id: string;
      email: string;
      role: Role;
      sessionVersion: number;
    },
    authenticatedAt = new Date(),
  ) {
    const accessToken = this.signAccessToken(user, authenticatedAt);
    const refreshToken = await this.createRefreshToken(user.id, authenticatedAt);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(
    userId: string,
    authenticatedAt: Date,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string> {
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        userId,
        authenticatedAt,
        expiresAt,
      },
    });

    return refreshToken;
  }

  async validateRefreshToken(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(token) },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (refreshToken.revokedAt) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    return refreshToken;
  }

  public async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashRefreshToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const validToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!validToken || validToken.revokedAt || validToken.expiresAt <= now) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      const revoked = await tx.refreshToken.updateMany({
        where: { id: validToken.id, tokenHash, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      const newRefreshToken = await this.createRefreshToken(
        validToken.userId,
        validToken.authenticatedAt,
        tx,
      );
      const accessToken = this.signAccessToken(validToken.user, validToken.authenticatedAt);

      return { accessToken, refreshToken: newRefreshToken };
    });
  }

  async register(dto: RegisterDto) {
    if (!dto.termsAccepted || !dto.privacyAccepted) {
      throw new BadRequestException(
        'Debes aceptar los Términos de uso y la Política de Privacidad',
      );
    }

    const cleanEmail = dto.email.trim().toLowerCase();

    await this.authRateLimit.checkEmailLimit(cleanEmail, {
      label: 'register',
      limit: 3,
      ttlMs: 15 * 60_000,
    });

    const existing = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      this.recordAuthEvent('registration', 'password', 'failure', 'duplicate');
      throw new ConflictException('Ya existe una cuenta con este correo');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const publicAlias = await createUniquePublicAlias(this.prisma, dto.username || cleanEmail);

    const user = await this.prisma.user.create({
      data: {
        email: cleanEmail,
        name: dto.username,
        passwordHash: hashedPassword,
        authProvider: AuthProvider.PASSWORD,
        googleId: null,
        emailVerified: false,
        role: Role.USER,
        publicAlias,
        showInRanking: true,
        searchableByAlias: true,
        showPresenceToFriends: true,
        shareStatsWithFriends: true,
        allowFriendRequests: true,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    this.registrationsCounter.inc();
    this.recordAuthEvent('registration', 'password', 'success', 'none');

    const tokens = await this.createAuthTokens(user);

    return { ...tokens, user };
  }

  async login(dto: LoginDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    await this.authRateLimit.checkEmailLimit(cleanEmail, {
      label: 'login',
      limit: 5,
      ttlMs: 15 * 60_000,
    });

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.passwordHash) {
      this.loginFailuresCounter?.labels('invalid_credentials').inc();
      this.recordAuthEvent('login', 'password', 'failure', 'invalid_credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      this.loginFailuresCounter?.labels('invalid_credentials').inc();
      this.recordAuthEvent('login', 'password', 'failure', 'invalid_credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    this.loginsCounter.inc();
    this.recordAuthEvent('login', 'password', 'success', 'none');
    const authenticatedAt = new Date();
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: authenticatedAt } });
    return this.createAuthTokens(user, authenticatedAt);
  }

  getGoogleAuthUrl(
    lang: AuthRedirectLocale = 'es-latam',
    consent?: { termsAccepted: boolean; privacyAccepted: boolean },
    intent: GoogleAuthIntent = 'login',
  ): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID no configurado');
    }

    const redirectUri = this.getGoogleRedirectUri();

    const state = this.jwt.sign(
      {
        purpose: 'google-oauth',
        lang,
        termsAccepted: Boolean(consent?.termsAccepted),
        privacyAccepted: Boolean(consent?.privacyAccepted),
        intent,
      } satisfies GoogleOAuthState,
      { expiresIn: GOOGLE_OAUTH_STATE_TTL_SECONDS },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: intent === 'delete-account' ? 'login' : 'select_account',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  parseGoogleOAuthState(state: string | undefined): GoogleOAuthState | null {
    if (!state) return null;

    try {
      const parsed = this.jwt.verify<GoogleOAuthState>(state);
      if (
        parsed.purpose !== 'google-oauth' ||
        (parsed.intent !== 'login' && parsed.intent !== 'delete-account')
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async loginWithGoogle(
    code: string,
    consent?: { termsAccepted: boolean; privacyAccepted: boolean },
  ) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID no configurado');
    }

    if (!clientSecret) {
      throw new BadRequestException('GOOGLE_CLIENT_SECRET no configurado');
    }

    const redirectUri = this.getGoogleRedirectUri();

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('No se pudo validar el login con Google');
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google no devolvió access token');
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException('No se pudo obtener el perfil de Google');
    }

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!googleUser.email || !googleUser.email_verified) {
      throw new UnauthorizedException('La cuenta de Google no tiene email verificado');
    }

    const cleanEmail = googleUser.email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      if (!consent?.termsAccepted || !consent?.privacyAccepted) {
        throw new ForbiddenException({
          code: 'GOOGLE_CONSENT_REQUIRED',
          message: 'Debes aceptar los Términos de uso y la Política de Privacidad',
        });
      }

      const name = googleUser.name || googleUser.given_name || cleanEmail.split('@')[0];
      const publicAlias = await createUniquePublicAlias(this.prisma, name);

      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          name,
          passwordHash: null,
          authProvider: AuthProvider.GOOGLE,
          googleId: googleUser.sub,
          emailVerified: true,
          role: Role.USER,
          publicAlias,
          showInRanking: true,
          searchableByAlias: true,
          showPresenceToFriends: true,
          shareStatsWithFriends: true,
          allowFriendRequests: true,
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      });

      this.registrationsCounter.inc();
      this.recordAuthEvent('registration', 'google', 'success', 'none');
    } else if (user.googleId && user.googleId !== googleUser.sub) {
      throw new UnauthorizedException('La cuenta de Google no coincide con esta cuenta');
    } else if (!user.googleId || !user.emailVerified) {
      // Un correo verificado por Google prueba la titularidad del mismo correo
      // de una cuenta local. Se vincula como proveedor adicional sin cambiar
      // authProvider: la contraseña sigue siendo el método de recuperación.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? googleUser.sub,
          emailVerified: true,
        },
      });
    }

    this.loginsCounter.inc();
    this.recordAuthEvent('login', 'google', 'success', 'none');
    const authenticatedAt = new Date();
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: authenticatedAt } });
    return this.createAuthTokens(user, authenticatedAt);
  }

  async requestPasswordReset(dto: ForgotPasswordDto): Promise<void> {
    if (!this.passwordResetMail.isConfigured()) {
      throw new ServiceUnavailableException(
        'La recuperación de contraseña por correo no está disponible actualmente',
      );
    }

    const cleanEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      this.passwordResetRequestsCounter?.labels('unknown_email').inc();
      this.recordAuthEvent('password_reset_request', 'email', 'requested', 'unknown_email');
      return;
    }

    this.passwordResetRequestsCounter?.labels('created').inc();
    this.recordAuthEvent('password_reset_request', 'email', 'requested', 'none');

    const token = this.generatePasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);
    const ttlMinutes = this.config.get<number>('PASSWORD_RESET_TOKEN_TTL_MINUTES', 60);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const now = new Date();

    const passwordResetToken = await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });

      return tx.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });
    });

    try {
      await this.passwordResetMail.sendPasswordResetEmail({
        to: user.email,
        token,
        locale: dto.locale,
      });
    } catch (error) {
      await this.prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });

      this.passwordResetEmailFailedCounter?.inc();
      this.recordAuthEvent('password_reset_email', 'email', 'failure', 'delivery_error');

      this.logger.error(
        `No se pudo enviar el correo de recuperación para el usuario ${user.id}: ${
          error instanceof Error ? error.name : 'UnknownError'
        }`,
      );
      return;
    }
    this.recordAuthEvent('password_reset_email', 'email', 'success', 'none');
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashPasswordResetToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      this.passwordResetCompletedCounter?.labels('invalid_or_expired').inc();
      this.recordAuthEvent('password_reset_complete', 'email', 'failure', 'invalid_or_expired');
      throw new BadRequestException('El enlace es inválido o ha expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        this.passwordResetCompletedCounter?.labels('reused').inc();
        this.recordAuthEvent('password_reset_complete', 'email', 'failure', 'reused');
        throw new BadRequestException('El enlace es inválido o ha expirado');
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          sessionVersion: { increment: 1 },
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: now },
      });
    });

    this.passwordResetCompletedCounter?.labels('success').inc();
    this.recordAuthEvent('password_reset_complete', 'email', 'success', 'none');
  }

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; ver?: number }>(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          layout: true,
          interfaceLanguage: true,
          authProvider: true,
          emailVerified: true,
          sessionVersion: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if ((payload.ver ?? 0) !== user.sessionVersion) {
        throw new Error('Session revoked');
      }

      const { sessionVersion: _, ...publicUser } = user;

      return publicUser;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
