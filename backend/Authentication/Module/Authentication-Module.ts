import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {MailModule} from "../Email/Email-Module";
import {BlacklistedToken, BlacklistedTokenSchema} from "../Token/blacklisted-token.schema";
import {UserModule} from "../../User/Module/User-Module";
import {AuthService} from "./Authentication-Service";
import {JwtStrategy} from "../Strategies/JWT-Strategies";
import {TempJwtStrategy} from "../Strategies/MFA-JWT-Strategies";
import {TempJwtGuard} from "../Guards/MFA-Guard";
import {JwtAuthGuard} from "../Guards/Authentication-Guard";
import {AuthController} from "./Authentication-Controller";



@Module({
    imports: [
        ConfigModule,
        MailModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '7d' }, // JwtModule default
            }),
        }),
        MongooseModule.forFeature([{ name: BlacklistedToken.name, schema: BlacklistedTokenSchema }]),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, TempJwtStrategy, TempJwtGuard, JwtAuthGuard],
    exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
