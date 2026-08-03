import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface PasswordResetEmail {
  to: string;
  token: string;
  locale: 'es' | 'en';
}

@Injectable()
export class PasswordResetMailService {
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.transporter = null;
      return;
    }

    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<boolean>('SMTP_SECURE', false),
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetEmail({ to, token, locale }: PasswordResetEmail): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP no configurado');
    }

    const publicUrl = this.config
      .get<string>('APP_PUBLIC_URL', 'http://localhost:3001')
      .replace(/\/+$/, '');
    const resetUrl = `${publicUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
    const from = this.config.get<string>('MAIL_FROM', 'no-reply@example.com');
    const ttlMinutes = this.config.get<number>('PASSWORD_RESET_TOKEN_TTL_MINUTES', 60);
    const isSpanish = locale === 'es';
    const subject = isSpanish ? 'Restablece tu contraseña' : 'Reset your password';
    const expiration = isSpanish
      ? ttlMinutes === 60
        ? 'una hora'
        : `${ttlMinutes} minutos`
      : ttlMinutes === 60
        ? 'one hour'
        : `${ttlMinutes} minutes`;
    const text = isSpanish
      ? `Usa este enlace para restablecer tu contraseña. Caduca en ${expiration} y solo puede usarse una vez:\n\n${resetUrl}\n\nSi no solicitaste el cambio, ignora este mensaje.`
      : `Use this link to reset your password. It expires in ${expiration} and can only be used once:\n\n${resetUrl}\n\nIf you did not request this change, ignore this message.`;
    const heading = isSpanish ? 'Restablece tu contraseña' : 'Reset your password';
    const action = isSpanish ? 'Restablecer contraseña' : 'Reset password';
    const notice = isSpanish
      ? `El enlace caduca en ${expiration} y solo puede usarse una vez.`
      : `The link expires in ${expiration} and can only be used once.`;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: [
        `<h1>${heading}</h1>`,
        `<p>${notice}</p>`,
        `<p><a href="${resetUrl}">${action}</a></p>`,
      ].join(''),
    });
  }
}
