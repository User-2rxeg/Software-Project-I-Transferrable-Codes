import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../Decorators/Public-Decorator';
import { AuthService } from '../Module/Authentication-Service';


@Injectable()
export class JwtAuthGuard extends NestAuthGuard('jwt') {
    constructor(
        private readonly reflector: Reflector,
        private readonly auth: AuthService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Allow @Public routes
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        try {
            await super.canActivate(context);
        } catch (err) {
            throw err;
        }

        // Token exists & valid at this point
        const req = context.switchToHttp().getRequest<Request>();
        const user = (req as any).user;

        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const token = (req as any).cookies?.access_token;
        if (!token) throw new UnauthorizedException('Missing authentication token');

        const isBlacklisted = await this.auth.isAccessTokenBlacklisted(token);
        if (isBlacklisted) {
            throw new UnauthorizedException('Session expired. Please sign in again.');
        }

        return true;
    }
}
