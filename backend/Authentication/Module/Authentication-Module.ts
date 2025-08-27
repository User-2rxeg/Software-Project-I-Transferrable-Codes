

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {BlacklistedToken, BlacklistedTokenSchema} from "../../Database/Token";
import {UserModule} from "../../User/User-Module";
import {AuthController} from "./Authentication-Controller";
import {AuthService} from "./Authentication-Service";
import {TempJwtStrategy} from "../Strategies/MFA-JWT.Strategies";
import {JwtStrategy} from "../Strategies/JWT-Strategies";
import {TempJwtGuard} from "../Guards/MFA-JWT.Guard";



@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '1h' },
            }),
        }),
        MongooseModule.forFeature([
            { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
        ]),
        forwardRef(() => UserModule),
        //MailModule,// <-- nothing else in imports!
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, TempJwtStrategy, TempJwtGuard],
    exports: [AuthService, JwtModule], // AuthService needed by guards in other modules
})
export class AuthModule {}