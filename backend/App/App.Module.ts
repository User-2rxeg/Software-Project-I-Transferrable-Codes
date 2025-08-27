// src/App.Module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {AuditLogModule} from "../Audit-Log/Audit-Log.Module";
import {AuthModule} from "../Authentication/Module/Authentication-Module";
import {UserModule} from "../User/User-Module";
import {NotificationModule} from "../Communication/Notification/Notification-Module";
import {BackupModule} from "../Backup/Backup-Module";
import {AdminModule} from "../Admin/Admin-Module";
import {ChatModule} from "../Communication/Chat/Chat-Module";
import {ScheduleModule} from "@nestjs/schedule";
import {JwtAuthGuard} from "../Authentication/Guards/AuthGuard";
import {RolesGuard} from "../Authentication/Guards/Roles-Guard";


@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        AuditLogModule,
        AuthModule, // <-- make sure this is imported so JwtAuthGuard can inject AuthService
        UserModule,
        //QuizModule,
        //QuizAttemptModule,
        //CourseModule,
        //ForumModule,
        NotificationModule,
        //PerformanceModule,
        BackupModule,
        AdminModule,
        //AnalyticsModule,
        ChatModule,
        //MailModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard }, // global JWT guard
        { provide: APP_GUARD, useClass: RolesGuard },   // global Roles guard (optional but handy)
    ],
})
export class AppModule {}



