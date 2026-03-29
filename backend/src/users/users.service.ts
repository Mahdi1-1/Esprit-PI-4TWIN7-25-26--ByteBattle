import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { computeDuelStats } from '../duels/duel-stats.util';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import * as bcrypt from 'bcryptjs';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) { }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, username: true, firstName: true, lastName: true,
          profileImage: true, role: true, status: true, level: true, xp: true,
          elo: true, tokensLeft: true, isPremium: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data: users, total, page, limit };
  }

  async findOne(id: string) {
    const cacheKey = `user:profile:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true, discussions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...profile } = user;
    
    await this.cache.set(cacheKey, profile, 3600); // 1 hour cache
    return profile;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    const { passwordHash, ...profile } = updated;

    await this.cache.del(`user:profile:${id}`);
    
    return profile;
  }

  async updateRole(id: string, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          challenge: { select: { id: true, title: true, kind: true, difficulty: true } },
        },
      }),
      this.prisma.submission.count({ where: { userId } }),
    ]);
    return { data: submissions, total, page, limit };
  }

  /**
   * Upload and resize profile photo
   */
  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPG, PNG, and WebP are allowed.');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File is too large. Maximum size is 5MB.');
    }

    // Delete old photo if exists
    if (user.profileImage) {
      const oldFilePath = path.join('./uploads/avatars', user.profileImage);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Resize to 200x200 and save as WebP
    const filename = `${userId}.webp`;
    const outputPath = path.join('./uploads/avatars', filename);

    await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Update user profileImage
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: filename },
    });

    const { passwordHash, ...profile } = updated;
    
    await this.cache.del(`user:profile:${userId}`);
    return profile;
  }

  /**
   * Delete profile photo
   */
  async deleteProfilePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Delete file if exists
    if (user.profileImage) {
      const filePath = path.join('./uploads/avatars', user.profileImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update user profileImage to null
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    await this.cache.del(`user:profile:${userId}`);
    return { success: true };
  }

  /**
   * Get profile photo URL
   */
  getPhotoUrl(filename: string): string {
    return `/users/photo/${filename}`;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if OAuth user
    if (user.isOAuthUser) {
      throw new BadRequestException('OAuth users cannot change their password');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true };
  }

  /**
   * Change email
   */
  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if OAuth user
    if (user.isOAuthUser) {
      throw new BadRequestException('OAuth users cannot change their email');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if email is already in use
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.newEmail } });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This email is already in use');
    }

    // Update email
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail },
    });

    const { passwordHash, ...profile } = updated;
    return profile;
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(userId: string) {
    const cacheKey = `user:stats:${userId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Query stats in parallel
    const [
      submissions,
      discussionsCount,
      commentsCount,
      totalUsers,
    ] = await Promise.all([
      // Count distinct challenges solved (verdict = 'accepted')
      this.prisma.submission.groupBy({
        by: ['challengeId'],
        where: { userId, verdict: 'AC' },
      }),
      // Count discussions
      this.prisma.discussion.count({ where: { authorId: userId } }),
      // Count comments
      this.prisma.comment.count({ where: { authorId: userId } }),
      // Total users for leaderboard position
      this.prisma.user.count(),
    ]);

    const challengesSolved = submissions.length;

    // Calculate duel stats dynamically from relations
    const ds = await computeDuelStats(this.prisma, userId);

    // Calculate leaderboard position
    const leaderboardPosition = await this.prisma.user.count({
      where: { elo: { gt: user.elo } },
    }) + 1;

    const stats = {
      elo: user.elo,
      xp: user.xp,
      level: user.level,
      duelsWon: ds.duelsWon,
      duelsLost: ds.duelsLost,
      duelsTotal: ds.duelsTotal,
      winRate: ds.winRate,
      challengesSolved,
      discussionsCount,
      commentsCount,
      leaderboardPosition,
      totalUsers,
      joinedAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
    };

    await this.cache.set(cacheKey, stats, 120); // Cache stats for 2 minutes (stats are computed dynamically now)
    return stats;
  }

  /**
   * Delete account
   */
  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Delete profile photo if exists
    if (user.profileImage) {
      const filePath = path.join('./uploads/avatars', user.profileImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete user (cascading deletes related records)
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }
}
