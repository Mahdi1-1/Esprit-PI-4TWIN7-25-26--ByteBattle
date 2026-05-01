import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type AppRole = 'user' | 'moderator' | 'admin';

/**
 * Specify the minimum role(s) required for this endpoint.
 * With hierarchical RBAC, @Roles('user') allows user + moderator + admin.
 * @Roles('moderator') allows moderator + admin, etc.
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
