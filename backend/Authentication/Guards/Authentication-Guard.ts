import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../Decorators/Public-Decorator';
import { AuthService } from '../Module/Authentication-Service';
import { AuditLogService } from '../../Audit-Log/Module/Audit-Log.Service';

import { normalizeBearerToken } from '../Token/token.helper';
import {Logs} from "../../Audit-Log/Model/Logs";


@Injectable()
export class JwtAuthGuard extends NestAuthGuard('jwt') {
    constructor(
        private readonly reflector: Reflector,
        private readonly audit: AuditLogService,
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

        // Let passport validate token (signature + expiry)
        try {
            await super.canActivate(context);
        } catch (err) {
            await this.audit.log(Logs.UNAUTHORIZED_ACCESS, undefined, {
                reason: 'JWT_VALIDATION_FAILED',
            }).catch(() => {});
            throw err;
        }

        // Token exists & valid at this point
        const req = context.switchToHttp().getRequest<Request>();
        const user = (req as any).user;

        if (!user) {
            await this.audit.log(Logs.UNAUTHORIZED_ACCESS, undefined, {
                reason: 'NO_USER_IN_REQ',
            }).catch(() => {});
            throw new UnauthorizedException('Unauthorized');
        }

        // Extract raw token
        const token = normalizeBearerToken(req.headers.authorization as string);
        if (!token) throw new BadRequestException('Missing token');

        // Check blacklist (logout)
        const isBlacklisted = await this.auth.isAccessTokenBlacklisted(token);
        if (isBlacklisted) {
            await this.audit.log(Logs.UNAUTHORIZED_ACCESS, user.sub, {
                reason: 'BLACKLISTED_TOKEN',
            }).catch(() => {});
            throw new UnauthorizedException('Session expired. Please sign in again.');
        }

        return true;
    }
}
