import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Hierarchical RBAC guard.
 * Role hierarchy: admin > moderator > user
 * A higher role automatically inherits all lower-role permissions.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: none`,
      );
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    // User passes if their hierarchy level >= the minimum required level
    const minRequired = Math.min(
      ...requiredRoles.map(r => ROLE_HIERARCHY[r] ?? 99),
    );

    if (userLevel < minRequired) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }
    return true;
  }
}
