// backend/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, Inject, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface GoogleUserDto {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly verificationResendCooldownMs = 30 * 1000;

  constructor(
    @Inject(PrismaService) private prisma: any,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const verificationExpiration = new Date(Date.now() + 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        provider: 'local',
        isOAuthUser: false,
        emailVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpiration,
        emailVerificationLastSentAt: new Date(),
      },
    });

    const verificationLink = this.buildFrontendUrl(`/verify-email?token=${rawVerificationToken}`);
    await this.emailService.sendVerificationEmail(user.email, user.username, verificationLink);

    return {
      message: 'Registration successful. Please verify your email before logging in.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Vérifier si c'est un compte OAuth
    if (user.isOAuthUser && !user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please sign in with Google.'
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is suspended or banned');
    }

    return this.generateTokens(user);
  }

  // ✨ NOUVEAU: Validation/Création utilisateur Google
  async validateOrCreateGoogleUser(dto: GoogleUserDto) {
    this.logger.log(`🔐 Google OAuth attempt: ${dto.email}`);

    // Vérifier si l'utilisateur existe avec ce Google ID
    let user = await this.prisma.user.findFirst({ // Changed findUnique to findFirst as unique constraint is removed
      where: { googleId: dto.googleId },
    });

    if (user) {
      this.logger.log(`✅ Existing Google user: ${user.email}`);
      return user;
    }

    // Vérifier si un utilisateur avec cet email existe
    user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      // Lier le compte Google à l'utilisateur existant
      this.logger.log(`🔗 Linking Google account to existing user: ${user.email}`);

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: dto.googleId,
          isOAuthUser: true,
          provider: 'google',
          profileImage: dto.profileImage || user.profileImage,
        },
      });

      return user;
    }

    // Créer un nouveau utilisateur
    this.logger.log(`🆕 Creating new Google user: ${dto.email}`);

    // Générer un username unique
    const baseUsername = dto.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    user = await this.prisma.user.create({
      data: {
        googleId: dto.googleId,
        email: dto.email,
        username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        profileImage: dto.profileImage,
        isOAuthUser: true,
        provider: 'google',
        passwordHash: null,
        tokensLeft: 20, // Bonus de bienvenue
      },
    });

    this.logger.log(`✅ New Google user created: ${user.email} (${username})`);
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId, status: 'active' },
      include: { company: { select: { id: true, name: true, slug: true, verified: true } } },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = user;
    return {
      ...profile,
      companyId: membership?.companyId || null,
      companyRole: membership?.role || null,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    if (!dto.token || typeof dto.token !== 'string') {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        emailVerificationLastSentAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.emailVerified) {
      return { message: 'If an account exists and is not yet verified, a new verification email has been sent.' };
    }

    const lastSentAt = user.emailVerificationLastSentAt ? new Date(user.emailVerificationLastSentAt).getTime() : 0;
    if (Date.now() - lastSentAt < this.verificationResendCooldownMs) {
      return { message: 'If an account exists and is not yet verified, a new verification email has been sent.' };
    }

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const verificationExpiration = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpiration,
        emailVerificationLastSentAt: new Date(),
      },
    });

    const verificationLink = this.buildFrontendUrl(`/verify-email?token=${rawVerificationToken}`);
    await this.emailService.sendVerificationEmail(user.email, user.username, verificationLink);

    return { message: 'If an account exists and is not yet verified, a new verification email has been sent.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || (user.isOAuthUser && !user.passwordHash)) {
      return { message: 'If an account exists, a password reset link has been sent to your email.' };
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const resetExpiration = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpires: resetExpiration,
      },
    });

    const resetLink = this.buildFrontendUrl(`/reset-password?token=${rawResetToken}`);
    await this.emailService.sendPasswordResetEmail(user.email, user.username, resetLink);

    return { message: 'If an account exists, a password reset link has been sent to your email.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token || typeof dto.token !== 'string') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  private buildFrontendUrl(path: string) {
    const publicFrontendUrl = this.configService.get<string>('PUBLIC_FRONTEND_URL');
    const frontendUrl = publicFrontendUrl
      || this.configService.get<string>('FRONTEND_URL')
      || 'http://bytebattle.local';
    const normalizedBaseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        isOAuthUser: user.isOAuthUser,
        provider: user.provider,
      },
    };
  }
}
