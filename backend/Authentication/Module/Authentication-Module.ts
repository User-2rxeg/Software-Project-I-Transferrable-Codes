

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {BlacklistedToken, BlacklistedTokenSchema} from "../Token/Token";
import {UserModule} from "../../User/Module/User-Module";
import {AuthController} from "./Authentication-Controller";
import {AuthService} from "./Authentication-Service";
import {TempJwtStrategy} from "../Strategies/MFA-JWT.Strategies";
import {JwtStrategy} from "../Strategies/JWT-Strategies";
import {TempJwtGuard} from "../Guards/MFA-Guard";
import {JwtAuthGuard} from "../Guards/Auth-Guard";
import {MailModule} from "../Email/Email-Module";
import {TokenBlacklistService} from "../Token/BlackList-Token.Service";

@Module({
    imports: [
        ConfigModule,
        MailModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                secret: cfg.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '1h' },
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

// @Module({
//     imports: [
//         ConfigModule,
//         JwtModule.registerAsync({
//             imports: [ConfigModule],
//             inject: [ConfigService],
//             useFactory: (cfg: ConfigService) => ({
//                 secret: cfg.get<string>('JWT_SECRET'),
//                 signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '1h' },
//             }),
//         }),
//         MongooseModule.forFeature([{ name: BlacklistedToken.name, schema: BlacklistedTokenSchema }]),
//         forwardRef(() => UserModule),
//     ],
//     controllers: [AuthController],
//     providers: [AuthService, JwtStrategy, TempJwtStrategy, TempJwtGuard, JwtAuthGuard],
//     exports: [AuthService, JwtModule, JwtAuthGuard],
// })
// export class AuthModule {}


// @Module({
//     imports: [
//         ConfigModule,
//         JwtModule.registerAsync({
//             imports: [ConfigModule],
//             inject: [ConfigService],
//             useFactory: (cfg: ConfigService) => ({
//                 secret: cfg.get<string>('JWT_SECRET'),
//                 signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '1h' },
//             }),
//         }),
//         MongooseModule.forFeature([
//             { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
//         ]),
//         forwardRef(() => UserModule),
//         //MailModule,// <-- nothing else in imports!
//     ],
//     controllers: [AuthController],
//     providers: [AuthService, JwtStrategy, TempJwtStrategy, TempJwtGuard],
//     exports: [AuthService, JwtModule], // AuthService needed by guards in other modules
// })
// export class AuthModule {}