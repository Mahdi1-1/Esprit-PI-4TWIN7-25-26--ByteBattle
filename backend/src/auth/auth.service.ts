// backend/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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

  constructor(
    @Inject(PrismaService) private prisma: any,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        provider: 'local',
        isOAuthUser: false,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier si c'est un compte OAuth
    if (user.isOAuthUser && !user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please sign in with Google.'
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

    const { passwordHash, ...profile } = user;
    return profile;
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