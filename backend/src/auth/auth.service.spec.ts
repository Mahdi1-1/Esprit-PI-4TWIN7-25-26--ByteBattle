import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  companyMembership: {
    findFirst: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, fallback?: string) => {
    if (key === 'FRONTEND_URL') return 'http://localhost:3000';
    if (key === 'PUBLIC_FRONTEND_URL') return undefined;
    return fallback;
  }),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: '$2a$10$hashedpassword',
  isOAuthUser: false,
  emailVerified: true,
  status: 'active',
  role: 'user',
  profileImage: null,
  provider: 'local',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto = {
      email: 'new@example.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'Password123!',
    };

    it('should throw ConflictException when email or username already taken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should create user and send verification email on success', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user',
        email: dto.email,
        username: dto.username,
      });

      const result = await service.register(dto);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('Registration successful');
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for OAuth-only users without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isOAuthUser: true,
        passwordHash: null,
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email not verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account suspended', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'suspended',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return access_token and user on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', email: 'test@example.com' }),
      );
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ─── validateOrCreateGoogleUser ──────────────────────────────────────────────

  describe('validateOrCreateGoogleUser()', () => {
    const googleDto = {
      googleId: 'google-123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      profileImage: 'https://image.url',
    };

    it('should return existing user when googleId matches', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u-google', ...googleDto });

      const result = await service.validateOrCreateGoogleUser(googleDto);

      expect(result.id).toBe('u-google');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should link Google account to existing email user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null); // no googleId match
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-u', email: googleDto.email });
      mockPrisma.user.update.mockResolvedValue({ id: 'existing-u', googleId: 'google-123' });

      const result = await service.validateOrCreateGoogleUser(googleDto);

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.googleId).toBe('google-123');
    });

    it('should create new user when no match found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null); // no email match, no username conflict
      mockPrisma.user.create.mockResolvedValue({ id: 'new-google-u', email: googleDto.email });

      const result = await service.validateOrCreateGoogleUser(googleDto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleId: 'google-123',
            isOAuthUser: true,
            provider: 'google',
          }),
        }),
      );
      expect(result.id).toBe('new-google-u');
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail()', () => {
    it('should throw BadRequestException for null/invalid token', async () => {
      await expect(service.verifyEmail({ token: null as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when token not found or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'invalid-token' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should mark email as verified on valid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail({ token: 'valid-raw-token' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ emailVerified: true }),
        }),
      );
      expect(result.message).toContain('verified');
    });
  });

  // ─── forgotPassword ──────────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('should return generic message when user not found (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });

      expect(result.message).toContain('If an account exists');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return generic message for OAuth-only accounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isOAuthUser: true,
        passwordHash: null,
      });

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(result.message).toContain('If an account exists');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should send reset email and update token for valid user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordResetToken: expect.any(String) }),
        }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('If an account exists');
    });
  });

  // ─── resetPassword ───────────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('should throw BadRequestException for null token', async () => {
      await expect(
        service.resetPassword({ token: null as any, newPassword: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token not found or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad-token', newPassword: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password hash on valid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-pw');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPass123!',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'new-hashed-pw',
            passwordResetToken: null,
          }),
        }),
      );
      expect(result.message).toContain('reset successfully');
    });
  });

  // ─── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toThrow(UnauthorizedException);
    });

    it('should return profile without passwordHash and with company info', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.companyMembership.findFirst.mockResolvedValue({
        companyId: 'company-1',
        role: 'recruiter',
        company: { id: 'company-1', name: 'Acme', slug: 'acme', verified: true },
      });

      const result = await service.getProfile('user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.companyId).toBe('company-1');
      expect(result.companyRole).toBe('recruiter');
    });

    it('should return null company info when no active membership', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.companyMembership.findFirst.mockResolvedValue(null);

      const result = await service.getProfile('user-1');

      expect(result.companyId).toBeNull();
      expect(result.companyRole).toBeNull();
    });
  });

  // ─── resendVerificationEmail ─────────────────────────────────────────────────

  describe('resendVerificationEmail()', () => {
    it('should return generic message when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resendVerificationEmail({ email: 'unknown@x.com' });

      expect(result.message).toContain('If an account exists');
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return generic message when email already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, emailVerified: true });

      const result = await service.resendVerificationEmail({ email: mockUser.email });

      expect(result.message).toContain('If an account exists');
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return generic message when within cooldown period', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        emailVerificationLastSentAt: new Date(), // just sent
      });

      const result = await service.resendVerificationEmail({ email: mockUser.email });

      expect(result.message).toContain('If an account exists');
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should resend verification when cooldown elapsed', async () => {
      const oldDate = new Date(Date.now() - 60 * 1000); // 60s ago
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        emailVerificationLastSentAt: oldDate,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resendVerificationEmail({ email: mockUser.email });

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('If an account exists');
    });
  });
});
