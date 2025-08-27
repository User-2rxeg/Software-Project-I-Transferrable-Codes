//import { ExecutionContext, Injectable } from '@nestjs/common';
//import { Reflector } from '@nestjs/core';
//import { AuthGuard } from '@nestjs/passport';
//import { IS_PUBLIC_KEY } from '../Decorators/Public-Decorator';

//@Injectable()
//export class JwtAuthGuard extends AuthGuard('jwt') {
//constructor(private readonly reflector: Reflector) {
//      super();
//}

//canActivate(context: ExecutionContext) {
//  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//    context.getHandler(),
//  context.getClass(),
//]);
//if (isPublic) return true;
//return super.canActivate(context);
// }
//}

//import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
//import { Reflector } from '@nestjs/core';
//import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
//import { IS_PUBLIC_KEY } from '../Decorators/Public-Decorator';
//import { AuditLogService } from '../../Audit-Log/Audit-Log.Service';         // ⬅ add
//import { AuthService } from '../AuthService';                               // ⬅ add
//import { Request } from 'express';

//@Injectable()
//export class JwtAuthGuard extends NestAuthGuard('jwt') {
//  constructor(
//    private readonly reflector: Reflector,
//  private readonly audit: AuditLogService,    // ⬅ add
// private readonly auth: AuthService,         // ⬅ add
//) {
//  super();
//}

//canActivate(context: ExecutionContext) {
//  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//    context.getHandler(),
//  context.getClass(),
//]);
//if (isPublic) return true;
//return super.canActivate(context);
//}


import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../Decorators/Public-Decorator';
;
import type { Request } from 'express';
import {AuditLogService} from "../../Audit-Log/Audit-Log.Service";
import {AuthService} from "../Module/Authentication-Service";


@Injectable()
export class JwtAuthGuard extends NestAuthGuard('jwt') {
    constructor(
        private readonly reflector: Reflector,
        private readonly audit: AuditLogService,
        private readonly auth: AuthService,
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;
        return super.canActivate(context);
    }


    // protected override async handleRequest(
    //     err: any,
    //     user: any,
    //     info: any,
    //     context: ExecutionContext,
    //     _status?: any,
    // ) {
    //     const req = context.switchToHttp().getRequest<Request>();
    //     const ip = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? 'unknown';
    //     const path = (req as any).originalUrl ?? req.url;
    //
    //     if (err || !user) {
    //         await this.audit.log('UNAUTHORIZED_ACCESS', undefined, {
    //             path,
    //             ip,
    //             reason: info?.message || 'NO_USER',
    //             authHeader: req.headers.authorization ? 'present' : 'absent',
    //         });
    //         throw err || new UnauthorizedException('Unauthorized');
    //     }
    //
    //     const token = req.headers.authorization?.startsWith('Bearer ')
    //         ? req.headers.authorization.slice(7)
    //         : undefined;
    //
    //     if (token && (await this.auth.isTokenBlacklisted(token))) {
    //         await this.audit.log('UNAUTHORIZED_ACCESS', user?.sub, { path, ip, reason: 'BLACKLISTED_TOKEN' });
    //         throw new UnauthorizedException('Session expired. Please sign in again.');
    //     }
    //
    //     return user;
    // }
}