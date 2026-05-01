import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyRole } from '@prisma/client';

export const COMPANY_ROLE_KEY = 'companyRole';
export const COMPANY_VERIFIED_KEY = 'companyVerified';

@Injectable()
export class CompanyRoleAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CompanyRole[]>(COMPANY_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userCompanyRole = user.companyRole as CompanyRole | undefined;
    
    if (!userCompanyRole || !requiredRoles.includes(userCompanyRole)) {
      throw new ForbiddenException('Insufficient company permissions');
    }

    return true;
  }
}

@Injectable()
export class CompanyVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredVerified = this.reflector.getAllAndOverride<boolean>(COMPANY_VERIFIED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredVerified === undefined || requiredVerified === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const companyVerified = user.company?.verified;

    if (!companyVerified) {
      throw new ForbiddenException('Company verification required for this action');
    }

    return true;
  }
}

export function SetCompanyRole(roles: CompanyRole[]) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(COMPANY_ROLE_KEY, roles, descriptor.value);
    return descriptor;
  };
}

export function SetCompanyVerified(required: boolean = true) {
  return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(COMPANY_VERIFIED_KEY, required, descriptor.value);
    return descriptor;
  };
}