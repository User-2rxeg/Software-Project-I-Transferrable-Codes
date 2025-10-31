
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './Email-Service';

@Module({
    imports: [ConfigModule],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}