import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CompanyRoleAuthGuard, CompanyVerifiedGuard } from './company-role.guard';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeContext = (user: any, handler?: any, cls?: any): ExecutionContext =>
  ({
    getHandler: () => handler ?? (() => {}),
    getClass: () => cls ?? class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any);

// ─────────────────────────────────────────────────────────────────────────────
// RolesGuard
// ─────────────────────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    expect(guard.canActivate(makeContext({ role: 'user' }))).toBe(true);
  });

  it('should allow access when required roles array is empty', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);
    expect(guard.canActivate(makeContext({ role: 'user' }))).toBe(true);
  });

  it('should throw ForbiddenException when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(() => guard.canActivate(makeContext({}))).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['user']);
    expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
  });

  it('should allow user with exact required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['user']);
    expect(guard.canActivate(makeContext({ role: 'user' }))).toBe(true);
  });

  it('should allow admin to access user-only routes (hierarchy)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['user']);
    expect(guard.canActivate(makeContext({ role: 'admin' }))).toBe(true);
  });

  it('should allow moderator to access user-only routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['user']);
    expect(guard.canActivate(makeContext({ role: 'moderator' }))).toBe(true);
  });

  it('should deny user from accessing moderator-only routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['moderator']);
    expect(() => guard.canActivate(makeContext({ role: 'user' }))).toThrow(ForbiddenException);
  });

  it('should deny moderator from accessing admin-only routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(() => guard.canActivate(makeContext({ role: 'moderator' }))).toThrow(ForbiddenException);
  });

  it('should allow admin to access admin-only routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(guard.canActivate(makeContext({ role: 'admin' }))).toBe(true);
  });

  it('should allow access when user has any of multiple required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin', 'moderator']);
    // min required = moderator (level 2), user has moderator (level 2) → pass
    expect(guard.canActivate(makeContext({ role: 'moderator' }))).toBe(true);
  });

  it('should deny unknown roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(() => guard.canActivate(makeContext({ role: 'superuser' }))).toThrow(ForbiddenException);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JwtAuthGuard
// ─────────────────────────────────────────────────────────────────────────────

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector);
  });

  it('should return true immediately for public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true); // isPublic = true
    const result = guard.canActivate(makeContext({ role: 'user' }));
    expect(result).toBe(true);
  });

  it('should delegate to parent AuthGuard for non-public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    // AuthGuard('jwt').canActivate will throw/return without a real passport context
    // We just verify the guard doesn't short-circuit to true
    const superActivateSpy = jest.spyOn(
      Object.getPrototypeOf(Object.getPrototypeOf(guard)),
      'canActivate',
    ).mockReturnValue(true as any);

    const result = guard.canActivate(makeContext({ role: 'user' }));
    expect(superActivateSpy).toHaveBeenCalled();
    superActivateSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CompanyRoleAuthGuard
// ─────────────────────────────────────────────────────────────────────────────

describe('CompanyRoleAuthGuard', () => {
  let guard: CompanyRoleAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new CompanyRoleAuthGuard(reflector);
  });

  it('should allow access when no company role is required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    expect(guard.canActivate(makeContext({ companyRole: 'member' }))).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['recruiter']);
    expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no companyRole', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['recruiter']);
    expect(() => guard.canActivate(makeContext({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has wrong company role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['owner']);
    expect(() => guard.canActivate(makeContext({ companyRole: 'recruiter' }))).toThrow(ForbiddenException);
  });

  it('should allow access when user has required company role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['recruiter']);
    expect(guard.canActivate(makeContext({ companyRole: 'recruiter' }))).toBe(true);
  });

  it('should allow access when user role is one of multiple allowed roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['recruiter', 'owner']);
    expect(guard.canActivate(makeContext({ companyRole: 'owner' }))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CompanyVerifiedGuard
// ─────────────────────────────────────────────────────────────────────────────

describe('CompanyVerifiedGuard', () => {
  let guard: CompanyVerifiedGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new CompanyVerifiedGuard(reflector);
  });

  it('should allow access when verification is not required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    expect(guard.canActivate(makeContext({ company: { verified: false } }))).toBe(true);
  });

  it('should allow access when metadata is undefined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({}))).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when company is not verified', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(() =>
      guard.canActivate(makeContext({ company: { verified: false } })),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no company', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(() => guard.canActivate(makeContext({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('should allow access when company is verified', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(makeContext({ company: { verified: true } }))).toBe(true);
  });
});
