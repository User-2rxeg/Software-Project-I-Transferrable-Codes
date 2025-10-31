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
            secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        // Only accept temp tokens that contain mfa: true
        if (!payload?.mfa) return null;
        return { sub: payload.sub, email: payload.email, role: payload.role, mfa: true };
    }
}
