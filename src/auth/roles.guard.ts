import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './enums/role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from the route decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get user from request (set by jwt-auth.guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if roles exist and are valid
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      throw new ForbiddenException('Access denied: No roles assigned.');
    }

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Access denied: Insufficient permissions.');
    }

    return true;
  }
}
