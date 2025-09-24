import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../Interfaces/JWT-Payload.Interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(cfg: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        return { sub: payload.sub, email: payload.email, role: payload.role };
    }
}
















//
// import {Injectable, UnauthorizedException} from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import {JwtPayload} from "../Interfaces/JWT-Payload.Interface";
// import {AuthService} from "../Module/Authentication-Service";
//
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//     constructor(cfg: ConfigService) {
//         super({
//             jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//             ignoreExpiration: false,
//             secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'), // <-- guaranteed string
//         });
//     }
//
//     async validate(payload: any) {
//         return { sub: payload.sub, email: payload.email, role: payload.role };
//     }
// }
//
//
//
// // @Injectable()
// // export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
// //     constructor(cfg: ConfigService, private readonly auth: AuthService) {
// //         super({
// //             jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), // or cookie/header if you prefer
// //             ignoreExpiration: false,
// //             secretOrKey: cfg.getOrThrow<string>('JWT_REFRESH_SECRET') ?? cfg.getOrThrow<string>('JWT_SECRET'),
// //         });
// //     }
// //
// //     async validate(payload: JwtPayload) {
// //         if (!payload?.jti) throw new UnauthorizedException('Invalid refresh token');
// //         const blacklisted = await this.auth.isJtiBlacklisted(payload.jti);
// //         if (blacklisted) throw new UnauthorizedException('Refresh token revoked');
// //         return payload; // becomes req.user
// //     }
// // }