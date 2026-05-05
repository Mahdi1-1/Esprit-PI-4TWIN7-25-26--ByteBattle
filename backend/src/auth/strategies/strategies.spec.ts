import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

// ─────────────────────────────────────────────────────────────────────────────
// JwtStrategy
// ─────────────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: { findUnique: jest.fn() },
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'JWT_SECRET') return 'test-secret';
    return undefined;
  }),
};

const activeUser = {
  id: 'user-1',
  email: 'alice@example.com',
  role: 'user',
  status: 'active',
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    const payload = { sub: 'user-1', email: 'alice@example.com', role: 'user' };

    it('should return user object when user is active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const result = await strategy.validate(payload);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual({ id: 'user-1', email: 'alice@example.com', role: 'user' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is suspended', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, status: 'suspended' });

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is banned', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, status: 'banned' });

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should return only safe fields (id, email, role)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        passwordHash: 'secret-hash',
        emailVerificationToken: 'tok',
      });

      const result = await strategy.validate(payload);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('emailVerificationToken');
      expect(Object.keys(result)).toEqual(['id', 'email', 'role']);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GoogleStrategy
// ─────────────────────────────────────────────────────────────────────────────

const mockAuthService = {
  validateOrCreateGoogleUser: jest.fn(),
};

const mockGoogleConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'GOOGLE_CLIENT_ID') return 'fake-client-id';
    if (key === 'GOOGLE_CLIENT_SECRET') return 'fake-client-secret';
    if (key === 'GOOGLE_CALLBACK_URL') return 'http://localhost:4000/auth/google/callback';
    return undefined;
  }),
};

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: mockGoogleConfig },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    jest.clearAllMocks();
  });

  describe('validate()', () => {
    const mockProfile = {
      id: 'google-123',
      emails: [{ value: 'alice@gmail.com' }],
      name: { givenName: 'Alice', familyName: 'Smith' },
      photos: [{ value: 'https://photo.url/pic.jpg' }],
    };

    it('should call authService.validateOrCreateGoogleUser with mapped fields', async () => {
      const mockUser = { id: 'user-1', email: 'alice@gmail.com' };
      mockAuthService.validateOrCreateGoogleUser.mockResolvedValue(mockUser);
      const done = jest.fn();

      await strategy.validate('access-tok', 'refresh-tok', mockProfile, done);

      expect(mockAuthService.validateOrCreateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'alice@gmail.com',
        firstName: 'Alice',
        lastName: 'Smith',
        profileImage: 'https://photo.url/pic.jpg',
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should call done(null, user) on success', async () => {
      const user = { id: 'user-1' };
      mockAuthService.validateOrCreateGoogleUser.mockResolvedValue(user);
      const done = jest.fn();

      await strategy.validate('tok', 'ref', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, user);
    });

    it('should call done(error, false) when authService throws', async () => {
      const error = new Error('OAuth error');
      mockAuthService.validateOrCreateGoogleUser.mockRejectedValue(error);
      const done = jest.fn();

      await strategy.validate('tok', 'ref', mockProfile, done);

      expect(done).toHaveBeenCalledWith(error, false);
    });

    it('should handle profile without photos gracefully', async () => {
      const profileNoPhoto = { ...mockProfile, photos: undefined };
      mockAuthService.validateOrCreateGoogleUser.mockResolvedValue({ id: 'u1' });
      const done = jest.fn();

      await strategy.validate('tok', 'ref', profileNoPhoto, done);

      expect(mockAuthService.validateOrCreateGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({ profileImage: undefined }),
      );
      expect(done).not.toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
