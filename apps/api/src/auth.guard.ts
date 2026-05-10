import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export const IS_PUBLIC = Symbol('IS_PUBLIC');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler() as { [IS_PUBLIC]?: boolean };
    const controller = context.getClass() as { [IS_PUBLIC]?: boolean };
    if (handler[IS_PUBLIC] || controller[IS_PUBLIC]) return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.path.includes('/admin')) return true;
    if (request.path.endsWith('/admin/login')) return true;
    if (request.path.endsWith('/admin/auth/login')) return true;
    const token = request.cookies?.admin_token || request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Auth required');
    try {
      const payload = await this.jwt.verifyAsync<{ role?: string }>(token, {
        secret: requireJwtSecret(),
      });
      if (payload.role !== 'admin') throw new UnauthorizedException('Admin role required');
      (request as Request & { user?: unknown }).user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid session');
    }
  }
}

export function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || (process.env.NODE_ENV === 'production' && secret.length < 32)) {
    throw new Error('JWT_SECRET is required and must be strong in production');
  }
  return secret || 'dev-only-local-secret-change-me-32chars';
}
