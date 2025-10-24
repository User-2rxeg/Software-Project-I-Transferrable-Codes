import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './Backup-Service';
import { CronBackupService } from '../Scheduler/Backup-Cron';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [BackupService, CronBackupService],
    exports: [BackupService],
})
export class BackupModule {}

