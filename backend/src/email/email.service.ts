import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';

import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  async sendVerificationEmail(email: string, username: string, verificationLink: string) {
    const subject = 'Verify your ByteBattle account';
    const html = this.renderEmailTemplate({
      title: 'Verify your ByteBattle account',
      greeting: `Hi ${username},`,
      intro: 'Your account was created successfully. Verify your email address to activate your account.',
      ctaLabel: 'Verify Email',
      ctaUrl: verificationLink,
      footer: 'Your account will stay inactive until verification is complete.',
    });

    await this.sendMail(email, subject, html, verificationLink);
  }

  async sendPasswordResetEmail(email: string, username: string, resetLink: string) {
    const subject = 'Reset your ByteBattle password';
    const html = this.renderEmailTemplate({
      title: 'Reset your ByteBattle password',
      greeting: `Hi ${username},`,
      intro: 'We received a request to reset your password. Use the button below to choose a new one.',
      ctaLabel: 'Reset Password',
      ctaUrl: resetLink,
      footer: 'If you did not request this email, you can safely ignore it.',
    });

    await this.sendMail(email, subject, html, resetLink);
  }

  private async sendMail(email: string, subject: string, html: string, link: string) {
    if (!this.transporter) {
      this.logger.warn(`SMTP not configured. Skipping email send to ${email}. Link: ${link}`);
      return;
    }

    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER') || 'no-reply@bytebattle.local';

    await this.transporter.sendMail({
      from,
      to: email,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${email}: ${subject}`);
  }

  private createTransporter(): Transporter | null {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string | number>('SMTP_PORT', 587));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = String(this.configService.get<string | boolean>('SMTP_SECURE', false)) === 'true';

    if (!host || !user || !pass) {
      this.logger.warn('SMTP environment variables are missing. Email will be logged only.');
      return null;
    }

    try {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create email transporter: ${error}`);
      return null;
    }
  }

  private renderEmailTemplate(params: {
    title: string;
    greeting: string;
    intro: string;
    ctaLabel: string;
    ctaUrl: string;
    footer: string;
  }) {
    const logoUrl = this.getLogoUrl();

    return `
      <div style="font-family: Arial, sans-serif; background:#0f172a; color:#e2e8f0; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#111827; border:1px solid #334155; border-radius:16px; padding:32px;">
          <div style="text-align:center; margin-bottom:20px;">
            <img src="${logoUrl}" alt="ByteBattle" style="max-width:180px; height:auto;" />
          </div>
          <h1 style="margin:0 0 16px; font-size:24px; color:#60a5fa;">${params.title}</h1>
          <p style="font-size:16px; line-height:1.6;">${params.greeting}</p>
          <p style="font-size:16px; line-height:1.6; color:#cbd5e1;">${params.intro}</p>
          <div style="margin:32px 0; text-align:center;">
            <a href="${params.ctaUrl}" style="display:inline-block; background:#3b82f6; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:10px; font-weight:bold;">${params.ctaLabel}</a>
          </div>
          <p style="font-size:13px; color:#94a3b8; text-align:center; margin-top:-8px;">
            For your security, this link expires in 60 minutes.
          </p>
          <p style="font-size:14px; color:#94a3b8; line-height:1.5;">${params.footer}</p>
        </div>
      </div>
    `;
  }

  private getLogoUrl() {
    const explicitLogoUrl = this.configService.get<string>('EMAIL_LOGO_URL');
    if (explicitLogoUrl) {
      return explicitLogoUrl;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/images/logo.png`;
  }
}
