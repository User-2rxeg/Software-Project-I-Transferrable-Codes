// App/App-Module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuditLogModule } from '../Audit-Log/Module/Audit-Log.Module';
import { AuthModule } from '../Authentication/Module/Authentication-Module';
import { UserModule } from '../User/Module/User-Module';
import { NotificationModule } from '../Communication/Notification/Module/Notification-Module';

import { AdminModule } from '../Admin/Module/Admin-Module';
import { ChatModule } from '../Communication/Chat/Module/Chat-Module';
import { JwtAuthGuard } from '../Authentication/Guards/Auth-Guard';
import { RolesGuard } from '../Authentication/Guards/Roles-Guard';
import {MailModule} from "../Authentication/Email/Email-Module";
import {FeedbackModule} from "../Communication/Feedback/Module/Feedback-Module";
import {BackupModule} from "../Backup/Module/Backup-Module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        AuditLogModule,
        AuthModule,
        UserModule,
        NotificationModule,
        AdminModule,
        ChatModule,
        MailModule,
        FeedbackModule,
        BackupModule,

    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule {}