import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {BackupService} from "./Backup-Service";


//@Injectable()
//export class BackupCron {
   // private readonly logger = new Logger(BackupCron.name);

    //constructor(private readonly backups: BackupService) {}

    // Runs daily at 03:30 server time
    //@Cron('30 3 * * *')
    //async nightly() {
        //try {
            //const res = await this.backups.runBackup({ dataType: 'all' });
          //  this.logger.log(`Nightly backup OK: ${JSON.stringify(res.results)}`);
        //} catch (e) {
      //      this.logger.error('Nightly backup failed', e as any);
    //    }
  //  }
//}

@Injectable()
export class BackupCron {
    private readonly logger = new Logger(BackupCron.name);


    constructor(private readonly backups: BackupService) {}


// Make schedule configurable; default daily at 03:30
    @Cron(process.env.BACKUP_CRON || '30 3 * * *')
    async nightly() {
        try {
            const res = await this.backups.runBackup({ dataType: 'all' as any });
            this.logger.log(`Nightly backup OK: ${JSON.stringify(res.results)}`);
        } catch (e) {
            this.logger.error('Nightly backup failed', e as any);
        }
    }
}