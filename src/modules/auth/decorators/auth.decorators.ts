import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../database/schemas/user.schema';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Convenience decorators for common role combinations
export const AdminOnly = () => Roles(UserRole.ADMIN);
export const ManagerOrAdmin = () => Roles(UserRole.ADMIN); // Since we only have USER and ADMIN
export const Authenticated = () => Roles(UserRole.USER, UserRole.ADMIN);
