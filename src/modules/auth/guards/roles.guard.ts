import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../database/schemas/user.schema';

// Define role hierarchy (higher index = more privileges)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn('User not found in request context');
      throw new ForbiddenException('User not found in request');
    }

    // Check role-based access
    if (requiredRoles && !this.hasRequiredRole(user.role, requiredRoles)) {
      this.logger.warn(
        `User ${user.email} (role: ${user.role}) attempted to access endpoint requiring roles: ${requiredRoles.join(
          ', ',
        )}`,
      );
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(', ')}. Current: ${user.role}`,
      );
    }

    this.logger.debug(
      `User ${user.email} (role: ${user.role}) granted access to ${context.getClass().name}.${context.getHandler().name}`,
    );

    return true;
  }

  private hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    // Check if user has any of the required roles
    const hasExactRole = requiredRoles.includes(userRole);
    if (hasExactRole) {
      return true;
    }

    // Check if user has a higher role in the hierarchy
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const hasHigherRole = requiredRoles.some(
      (requiredRole) => userRoleLevel >= ROLE_HIERARCHY[requiredRole],
    );

    return hasHigherRole;
  }
}
