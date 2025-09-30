import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {BackupService} from "./Backup-Service";
import {CronBackupService} from "../Scheduler/Backup-Cron";
import {BackupController} from "./Backup-Controller";
import {AuthModule} from "../../Authentication/Module/Authentication-Module";


@Module({
    imports: [ScheduleModule.forRoot(),AuthModule],
    providers: [BackupService, CronBackupService],
    controllers: [BackupController],
    exports: [BackupService],
})
export class BackupModule {}