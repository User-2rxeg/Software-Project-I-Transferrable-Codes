
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Backup, BackupSchema } from '../Database/Backup';


import {BackupCron} from "./Backup-Cron";
import {User, UserSchema} from "../Database/User";
import {AuthModule} from "../Authentication/Module/Authentication-Module";
import {BackupService} from "./Backup-Service";
import {BackupController} from "./Backup-Controller";



@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Backup.name, schema: BackupSchema },
            { name: User.name, schema: UserSchema },
            //{ name: Course.name, schema: CourseSchema },
            //{ name: Performance.name, schema: PerformanceSchema },
        ]),
        AuthModule,
    ],
    providers: [BackupService, BackupCron],
    controllers: [BackupController],
})
export class BackupModule {}