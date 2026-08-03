// src/auth/services/turnstile.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService) {}

  async verify(token?: string): Promise<void> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY');

    if (!secret) {
      return;
    }

    if (!token) {
      throw new BadRequestException('Verificación anti-bot requerida');
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('No se pudo verificar Turnstile');
    }

    const data = (await response.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      this.logger.warn(`Turnstile inválido: ${(data['error-codes'] ?? []).join(', ')}`);
      throw new BadRequestException('Verificación anti-bot inválida');
    }
  }
}
