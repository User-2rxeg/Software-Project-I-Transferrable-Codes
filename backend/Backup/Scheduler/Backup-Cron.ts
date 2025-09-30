import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {BackupService} from "../Module/Backup-Service";


@Injectable()
export class CronBackupService {
    private readonly logger = new Logger(CronBackupService.name);

    private readonly enableTest = (process.env.BACKUP_ENABLE_TEST ?? 'false') === 'true';
    private readonly testExpr = process.env.BACKUP_CRON_TEST ?? '*/5 * * * *';
    private readonly prodExpr = process.env.BACKUP_CRON_PROD ?? '0 17 * * *';
    private readonly tz = process.env.BACKUP_TIMEZONE ?? 'Africa/Cairo';

    constructor(private readonly backupService: BackupService) {}

    // Test schedule (every 5 minutes) — method always scheduled, but we exit early if disabled
    @Cron(process.env.BACKUP_CRON_TEST ?? '*/5 * * * *', { name: 'backupTest', timeZone: 'UTC' })
    async handleTestCron() {
        if (!this.enableTest) return;
        this.logger.log(`Running test backup (cron=${this.testExpr})`);
        try {
            const meta = await this.backupService.createBackup({
                name: 'test',
                oplog: (process.env.BACKUP_USE_OPLOG ?? 'false') === 'true',
                dumpDbUsersAndRoles: (process.env.BACKUP_DUMP_USERS ?? 'false') === 'true',
            });
            this.logger.log(`Test backup created: ${meta.filename}`);
        } catch (err) {
            this.logger.error('Test backup failed', String(err));
        }
    }

    // Production schedule — runs daily at specified time in the Africa/Cairo timezone
    @Cron(process.env.BACKUP_CRON_PROD ?? CronExpression.EVERY_DAY_AT_2AM, { name: 'backupProd', timeZone: 'Africa/Cairo' })
    async handleProdCron() {
        this.logger.log(`Running production backup (cron=${this.prodExpr}, tz=${this.tz})`);
        try {
            const meta = await this.backupService.createBackup({
                name: process.env.BACKUP_NAME_PREFIX ?? 'scheduled',
                oplog: (process.env.BACKUP_USE_OPLOG ?? 'false') === 'true',
                dumpDbUsersAndRoles: (process.env.BACKUP_DUMP_USERS ?? 'false') === 'true',
            });
            this.logger.log(`Scheduled backup created: ${meta.filename}`);
        } catch (err) {
            this.logger.error('Scheduled backup failed', String(err));
        }
    }
}
