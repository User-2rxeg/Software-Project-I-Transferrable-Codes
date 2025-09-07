

// src/Authentication/Email/Mail-Module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './Email-Service';

@Module({
    imports: [ConfigModule],  // MailService reads env via ConfigService
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}