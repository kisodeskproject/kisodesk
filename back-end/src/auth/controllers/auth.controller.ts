// src/auth/controllers/auth.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';

import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthService } from '../services/auth.service';
import { toAuthRedirectLocale } from '../auth-redirect-locale';
import {
  ACCESS_TOKEN_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SECONDS,
  getAuthCookieDomain,
  REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../auth-session.config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private clearLegacyHostOnlyAuthCookies(res: FastifyReply) {
    if (process.env.NODE_ENV !== 'production') return;

    for (const name of ['access_token', 'refresh_token']) {
      res.clearCookie(name, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  private setAuthCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
    this.clearLegacyHostOnlyAuthCookies(res);

    res.setCookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: ACCESS_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });

    res.setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  private clearAuthCookies(res: FastifyReply) {
    this.clearLegacyHostOnlyAuthCookies(res);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: ACCESS_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
    });
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 3, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: FastifyReply) {
    const result = await this.authService.register(dto);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: result.user.name,
        role: result.user.role,
        layout: result.user.layout,
        interfaceLanguage: result.user.interfaceLanguage,
        authProvider: result.user.authProvider,
        emailVerified: result.user.emailVerified,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: FastifyReply) {
    const result = await this.authService.login(dto);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return { message: 'Login exitoso' };
  }

  @Get('google')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  async googleLogin(
    @Query('lang') lang: string | undefined,
    @Query('termsAccepted') termsAccepted: string | undefined,
    @Query('privacyAccepted') privacyAccepted: string | undefined,
    @Query('intent') intent: string | undefined,
    @Res() res: FastifyReply,
  ) {
    const safeLang = toAuthRedirectLocale(lang);
    const consent = {
      termsAccepted: termsAccepted === 'true',
      privacyAccepted: privacyAccepted === 'true',
    };
    const googleUrl = this.authService.getGoogleAuthUrl(
      safeLang,
      consent,
      intent === 'delete-account' ? 'delete-account' : 'login',
    );

    return res.status(302).redirect(googleUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const oauthState = this.authService.parseGoogleOAuthState(state);
    const safeLang = toAuthRedirectLocale(oauthState?.lang);

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL no configurado');
    }

    const destination = oauthState?.intent === 'delete-account' ? 'dashboard/profile' : 'dashboard';
    if (!oauthState || error || !code) {
      const query =
        oauthState?.intent === 'delete-account' ? '?googleReauth=failed' : '?error=google';
      return res.status(302).redirect(`${frontendUrl}/${safeLang}/${destination}${query}`);
    }

    try {
      const consent = {
        termsAccepted: oauthState.termsAccepted,
        privacyAccepted: oauthState.privacyAccepted,
      };

      const result = await this.authService.loginWithGoogle(code, consent);

      this.setAuthCookies(res, result.accessToken, result.refreshToken);
      this.logger.log(
        `[requestId=${req.id}] Google callback authenticated; issued shared auth cookies`,
      );

      const query = oauthState.intent === 'delete-account' ? '?deleteAccount=1' : '';
      return res.status(302).redirect(`${frontendUrl}/${safeLang}/${destination}${query}`);
    } catch (exception) {
      this.logger.warn(
        `[requestId=${req.id}] Google callback failed with ${
          exception instanceof Error ? exception.name : 'UnknownError'
        }`,
      );
      const response =
        exception instanceof ForbiddenException ? exception.getResponse() : undefined;
      const consentRequired =
        oauthState.intent === 'login' &&
        typeof response === 'object' &&
        response !== null &&
        'code' in response &&
        response.code === 'GOOGLE_CONSENT_REQUIRED';
      const errorDestination = consentRequired ? 'register' : destination;
      const query = consentRequired
        ? '?google=consent-required'
        : oauthState.intent === 'delete-account'
          ? '?googleReauth=failed'
          : '?error=google';
      return res.status(302).redirect(`${frontendUrl}/${safeLang}/${errorDestination}${query}`);
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 15 * 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto);

    return {
      message: 'Si la cuenta existe, se procesará la solicitud de recuperación',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 15 * 60_000 } })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.resetPassword(dto);

    this.clearAuthCookies(res);

    return { message: 'Contraseña actualizada' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        await this.authService.revokeRefreshToken(refreshToken);
      } catch {
        // No bloqueante
      }
    }

    this.clearAuthCookies(res);

    return { message: 'Logout exitoso' };
  }

  @Get('me')
  async getCurrentUser(@Req() req: FastifyRequest) {
    const token = req.cookies?.access_token;

    if (!token) {
      return { authenticated: false, user: null };
    }

    try {
      const user = await this.authService.getUserFromToken(token);
      return { authenticated: true, user };
    } catch {
      return { authenticated: false, user: null };
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
  }
}
