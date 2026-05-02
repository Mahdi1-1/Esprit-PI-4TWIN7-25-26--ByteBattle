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
import { IntelligenceService } from '../intelligence/intelligence.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private intelligenceService: IntelligenceService,
  ) { }

  private mapDifficultyToRating(difficulty: unknown): number {
    const value = String(difficulty || '').toLowerCase();
    if (value === 'easy') return 800;
    if (value === 'medium') return 1300;
    if (value === 'hard') return 1700;
    const numeric = Number(difficulty);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return 1300;
  }

  private normalizeText(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private getChallengeRating(challenge: { difficulty: unknown }): number {
    return this.mapDifficultyToRating(challenge.difficulty);
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private getTagOverlapScore(challengeTags: string[], weakTags: string[]): number {
    if (!challengeTags.length || !weakTags.length) return 0;
    const challengeSet = new Set(challengeTags.map((tag) => this.normalizeText(tag)));
    const weakSet = new Set(weakTags.map((tag) => this.normalizeText(tag)));
    let overlap = 0;

    challengeSet.forEach((tag) => {
      if (weakSet.has(tag)) overlap += 1;
    });

    return overlap / Math.max(challengeSet.size, weakSet.size, 1);
  }

  private async mapRecommendedChallengesToExisting(
    recommendations: Array<{ challenge_id?: string; challenge_name?: string; cf_rating?: number; score?: number }>,
    weakTags: string[],
    topK: number,
    fallbackRating = 1300,
  ) {
    const publishedChallenges = await this.prisma.challenge.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
        kind: true,
        category: true,
        createdAt: true,
      },
    });

    if (publishedChallenges.length === 0) return [];

    const usedChallengeIds = new Set<string>();
    const mappedRecommendations: Array<{
      challenge_id: string;
      challenge_name: string;
      cf_rating: number;
      score: number;
    }> = [];

    const sortedRecommendations = [...recommendations].sort((left, right) => (right.score || 0) - (left.score || 0));

    for (const recommendation of sortedRecommendations) {
      const requestedTitle = this.normalizeText(recommendation.challenge_name);
      const requestedRating = Number(recommendation.cf_rating || 0);
      const modelScore = this.clamp01(Number(recommendation.score || 0));

      const candidates = publishedChallenges
        .map((challenge) => {
          const title = this.normalizeText(challenge.title);
          const rating = this.getChallengeRating(challenge);
          const tagScore = this.getTagOverlapScore(challenge.tags || [], weakTags);
          const titleScore = requestedTitle
            ? (title === requestedTitle ? 1 : (title.includes(requestedTitle) || requestedTitle.includes(title) ? 0.6 : 0))
            : 0;
          const ratingGap = requestedRating > 0 ? Math.abs(rating - requestedRating) : Math.abs(rating - 1300);
          const ratingScore = 1 / (1 + ratingGap / 100);
          const localScore = this.clamp01(0.5 * tagScore + 0.3 * ratingScore + 0.2 * titleScore);
          const blendedScore = this.clamp01(0.8 * localScore + 0.2 * modelScore);

          return {
            challenge,
            score: blendedScore,
          };
        })
        .filter(({ challenge }) => !usedChallengeIds.has(challenge.id))
        .sort((left, right) => right.score - left.score);

      const bestCandidate = candidates[0];
      if (!bestCandidate) continue;

      usedChallengeIds.add(bestCandidate.challenge.id);
      mappedRecommendations.push({
        challenge_id: bestCandidate.challenge.id,
        challenge_name: bestCandidate.challenge.title,
        cf_rating: this.getChallengeRating(bestCandidate.challenge),
        score: bestCandidate.score,
      });

      if (mappedRecommendations.length >= topK) break;
    }

    if (mappedRecommendations.length > 0) {
      return mappedRecommendations;
    }

    // Fallback: recommend from local published challenges only.
    const localFallback = publishedChallenges
      .map((challenge) => {
        const rating = this.getChallengeRating(challenge);
        const tagScore = this.getTagOverlapScore(challenge.tags || [], weakTags);
        const ratingGap = Math.abs(rating - fallbackRating);
        const ratingScore = 1 / (1 + ratingGap / 150);
        const combined = tagScore * 0.7 + ratingScore * 0.3;

        return {
          challenge,
          score: combined,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, topK)
      .map(({ challenge, score }) => ({
        challenge_id: challenge.id,
        challenge_name: challenge.title,
        cf_rating: this.getChallengeRating(challenge),
        score,
      }));

    return localFallback;
  }

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = updated;

    await this.cache.del(`user:profile:${id}`);
    
    return profile;
  }

  private static readonly VALID_ROLES = ['user', 'moderator', 'admin'];
  private static readonly VALID_STATUSES = ['active', 'suspended', 'banned'];

  async updateRole(id: string, role: string) {
    if (!UsersService.VALID_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role. Allowed: ${UsersService.VALID_ROLES.join(', ')}`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
  }

  async updateStatus(id: string, status: string) {
    if (!UsersService.VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${UsersService.VALID_STATUSES.join(', ')}`);
    }
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
   * Upload and resize profile photo — stored as Base64 data URI in DB
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

    // Delete old local file if one exists (migration cleanup)
    if (user.profileImage && !user.profileImage.startsWith('http') && !user.profileImage.startsWith('data:')) {
      const oldFilePath = path.join('./uploads/avatars', user.profileImage);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Resize to 200x200, convert to WebP, get as Buffer
    const resizedBuffer = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Convert to Base64 data URI and store in DB
    const base64 = resizedBuffer.toString('base64');
    const dataUri = `data:image/webp;base64,${base64}`;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: dataUri },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Cleanup legacy local file if one still exists on disk
    if (user.profileImage && !user.profileImage.startsWith('http') && !user.profileImage.startsWith('data:')) {
      const filePath = path.join('./uploads/avatars', user.profileImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear profileImage in DB
    await this.prisma.user.update({
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async getIntelligenceProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const latestSubmission = await this.prisma.submission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        challenge: {
          select: { id: true, title: true, difficulty: true, tags: true },
        },
      },
    });

    const currentSkills = {
      algo: Math.min(100, user.level * 10 + Math.floor(user.xp / 150)),
      data_structures: Math.min(100, user.level * 9 + Math.floor(user.xp / 180)),
      dynamic_programming: Math.min(100, user.level * 8),
      graphs: Math.min(100, user.level * 8),
      debugging: Math.min(100, 35 + Math.floor(user.tokensLeft)),
      clean_code: Math.min(100, 40 + Math.floor(user.level * 4)),
      speed: Math.min(100, 45 + Math.floor(user.elo / 80)),
    };

    const telemetry = latestSubmission?.challenge
      ? {
          user_id: userId,
          challenge_id: latestSubmission.challenge.id,
          challenge_name: latestSubmission.challenge.title,
          difficulty: this.mapDifficultyToRating((latestSubmission.challenge as any).difficulty),
          cf_rating: this.mapDifficultyToRating((latestSubmission.challenge as any).cfRating || (latestSubmission.challenge as any).cf_rating || (latestSubmission.challenge as any).difficulty),
          minutes_stuck: Math.max(0, Math.floor(((latestSubmission as any).timeMs || 0) / 60000)),
          attempts_count: Math.max(1, Number((latestSubmission as any).testsTotal || 1)),
          last_hint_level: 0,
          challenge_tags: Array.isArray((latestSubmission.challenge as any).tags) ? (latestSubmission.challenge as any).tags : [],
          code_lines: Math.max(1, String((latestSubmission as any).code || '').split('\n').length),
        }
      : {
          user_id: userId,
          challenge_id: 'profile-default',
          challenge_name: 'Profile Context',
          difficulty: 2,
          cf_rating: 1400,
          minutes_stuck: 0,
          attempts_count: 0,
          last_hint_level: 0,
          challenge_tags: [],
          code_lines: 40,
        };

    try {
      const profile = await this.intelligenceService.getProfile({
        ...telemetry,
        current_skills: currentSkills,
        top_k: 5,
      });

      const recommendedChallenges = await this.mapRecommendedChallengesToExisting(
        Array.isArray(profile?.recommended_challenges) ? profile.recommended_challenges : [],
        Array.isArray(profile?.weakest_tags) ? profile.weakest_tags : [],
        5,
        telemetry.cf_rating,
      );

      return {
        ...profile,
        current_skills: profile?.current_skills || currentSkills,
        updated_skills: profile?.updated_skills || profile?.current_skills || currentSkills,
        recommended_challenges: recommendedChallenges,
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        user_id: userId,
        current_skills: currentSkills,
        weakest_tags: [],
        recommended_challenges: [],
        fallback: true,
      };
    }
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

  /**
   * Get recent activity feed for a user
   * Merges: AC submissions + duel wins + discussions created
   */
  async getRecentActivity(userId: string, limit = 20) {
    const [submissions, duels, discussions] = await Promise.all([
      // Last AC submissions
      this.prisma.submission.findMany({
        where: { userId, verdict: 'AC' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          challenge: { select: { title: true, difficulty: true } },
        },
      }),
      // Last completed duels
      this.prisma.duel.findMany({
        where: {
          status: 'completed',
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
        orderBy: { endedAt: 'desc' },
        take: limit,
        include: {
          player1: { select: { username: true } },
          player2: { select: { username: true } },
        },
      }),
      // Last discussions created
      this.prisma.discussion.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, title: true, createdAt: true },
      }),
    ]);

    const events: { type: string; date: string; [k: string]: any }[] = [];

    for (const s of submissions) {
      events.push({
        type: 'solved',
        problem: s.challenge?.title ?? 'Unknown',
        difficulty: s.challenge?.difficulty ?? 'unknown',
        language: s.language,
        date: s.createdAt.toISOString(),
      });
    }

    for (const d of duels) {
      const won = d.winnerId === userId;
      const isPlayer1 = d.player1Id === userId;
      const opponent = isPlayer1 ? d.player2?.username : d.player1?.username;
      events.push({
        type: won ? 'duel_won' : 'duel_lost',
        opponent: opponent ?? 'Unknown',
        date: (d.endedAt ?? d.createdAt).toISOString(),
      });
    }

    for (const disc of discussions) {
      events.push({
        type: 'discussion',
        title: disc.title,
        id: disc.id,
        date: disc.createdAt.toISOString(),
      });
    }

    // Sort by date desc and take top N
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events.slice(0, limit);
  }

  // ─── Public Profile Methods (no auth) ──────────────────────────

  /**
   * Resolve a username to a userId, throw 404 if not found
   */
  private async resolveUsername(username: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.id;
  }

  /**
   * Get public profile by username — safe fields only (no email, no passwordHash)
   */
  async getPublicProfile(username: string) {
    const cacheKey = `user:public:${username.toLowerCase()}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      include: {
        _count: { select: { submissions: true, discussions: true } },
        earnedBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const profile = {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      elo: user.elo,
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
      badges: user.earnedBadges.map((ub) => ({
        key: ub.badge.key,
        name: ub.badge.name,
        ruleText: ub.badge.ruleText,
        iconUrl: ub.badge.iconUrl,
        rarity: ub.badge.rarity,
        earnedAt: ub.earnedAt.toISOString(),
      })),
    };

    await this.cache.set(cacheKey, profile, 300); // 5 min cache
    return profile;
  }

  /**
   * Get public stats by username — reuses getProfileStats logic
   */
  async getPublicStats(username: string) {
    const userId = await this.resolveUsername(username);
    return this.getProfileStats(userId);
  }

  /**
   * Get public activity feed by username — reuses getRecentActivity logic
   */
  async getPublicActivity(username: string, limit = 15) {
    const userId = await this.resolveUsername(username);
    return this.getRecentActivity(userId, limit);
  }

  /**
   * Search users by username (public — returns safe fields only)
   */
  async searchByUsername(query: string, limit = 8) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();
    const cacheKey = `user:search:${q.toLowerCase()}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const users = await this.prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        status: 'active',
      },
      select: {
        id: true,
        username: true,
        profileImage: true,
        level: true,
        elo: true,
      },
      orderBy: { elo: 'desc' },
      take: Math.min(limit, 20),
    });

    await this.cache.set(cacheKey, users, 60); // 1 min cache
    return users;
  }
}
