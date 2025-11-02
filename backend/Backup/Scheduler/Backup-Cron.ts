import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {BackupService} from "../Module/Backup-Service";
import { AuditLogService } from '../../Audit-Log/Module/Audit-Log.Service';
import { Logs} from "../../Audit-Log/Model/Logs";



@Injectable()
export class CronBackupService {
    private readonly logger = new Logger(CronBackupService.name);

    private readonly enableTest = (process.env.BACKUP_ENABLE_TEST ?? 'false') === 'true';
    private readonly testExpr = process.env.BACKUP_CRON_TEST ?? '*/5 * * * *';
    private readonly prodExpr = process.env.BACKUP_CRON_PROD ?? '0 17 * * *';
    private readonly tz = process.env.BACKUP_TIMEZONE ?? 'Africa/Cairo';

    constructor(
        private readonly backupService: BackupService,
        private readonly audit: AuditLogService,
    ) {}


    @Cron(process.env.BACKUP_CRON_TEST ?? '*/1 * * * *', { name: 'backupTest', timeZone: 'UTC' })
    async handleTestCron() {
        if (!this.enableTest) return;
        const details = {
            type: 'test',
            cron: this.testExpr,
            tz: 'UTC',
            origin: 'CronBackupService.backupTest',
            options: {
                oplog: (process.env.BACKUP_USE_OPLOG ?? 'false') === 'true',
                dumpDbUsersAndRoles: (process.env.BACKUP_DUMP_USERS ?? 'false') === 'true',
            },
        };
        this.logger.log(`Running test backup (cron=${this.testExpr})`);
        try {
            await this.audit.log(Logs.DATA_BACKUP_TEST_STARTED, undefined, details);
            const meta = await this.backupService.createBackup({
                name: 'test',
                oplog: details.options.oplog,
                dumpDbUsersAndRoles: details.options.dumpDbUsersAndRoles,
            });
            this.logger.log(`Test backup created: ${meta.filename}`);
            await this.audit.log(Logs.DATA_BACKUP_TEST_COMPLETED, undefined, { ...details, ...meta });
        } catch (err) {
            this.logger.error('Test backup failed', String(err));
            await this.audit.log(
                Logs.DATA_BACKUP_TEST_FAILED,
                undefined,
                { ...details, error: err instanceof Error ? err.message : String(err) }
            );
        }
    }

    // Production schedule — runs daily at specified time in the Africa/Cairo timezone
    @Cron(process.env.BACKUP_CRON_PROD ?? CronExpression.EVERY_DAY_AT_2AM, { name: 'backupProd', timeZone: 'Africa/Cairo' })
    async handleProdCron() {
        const details = {
            type: 'scheduled',
            cron: this.prodExpr,
            tz: this.tz,
            origin: 'CronBackupService.backupProd',
            options: {
                oplog: (process.env.BACKUP_USE_OPLOG ?? 'false') === 'true',
                dumpDbUsersAndRoles: (process.env.BACKUP_DUMP_USERS ?? 'false') === 'true',
            },
        };
        this.logger.log(`Running production backup (cron=${this.prodExpr}, tz=${this.tz})`);
        try {
            await this.audit.log(Logs.DATA_BACKUP_STARTED, undefined, details);
            const meta = await this.backupService.createBackup({
                name: process.env.BACKUP_NAME_PREFIX ?? 'scheduled',
                oplog: details.options.oplog,
                dumpDbUsersAndRoles: details.options.dumpDbUsersAndRoles,
            });
            this.logger.log(`Scheduled backup created: ${meta.filename}`);
            await this.audit.log(Logs.DATA_BACKUP_COMPLETED, undefined, { ...details, ...meta });
        } catch (err) {
            this.logger.error('Scheduled backup failed', String(err));
            await this.audit.log(
                Logs.DATA_BACKUP_FAILED,
                undefined,
                { ...details, error: err instanceof Error ? err.message : String(err) }
            );
        }
    }
}
