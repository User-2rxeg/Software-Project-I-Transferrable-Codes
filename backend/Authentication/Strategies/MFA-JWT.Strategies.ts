
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TempJwtStrategy extends PassportStrategy(Strategy, 'temp-jwt') {
    constructor(cfg: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'), // <-- fix: getOrThrow
        });
    }

    async validate(payload: any) {
        // Only allow tokens that were issued for mfa (payload.mfa === true)
        if (!payload?.mfa) return null; // returning null -> 401
        return { sub: payload.sub, email: payload.email, role: payload.role, mfa:true};
    }
}