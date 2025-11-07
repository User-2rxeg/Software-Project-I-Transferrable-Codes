import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    Body,
    Logger,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { BackupService, BackupMetadata } from './Backup-Service';
import { JwtAuthGuard } from '../../Authentication/Guards/Authentication-Guard';
import { RolesGuard } from '../../Authentication/Guards/Roles-Guard';
import { Roles } from '../../Authentication/Decorators/Roles-Decorator';
import { UserRole } from '../../User/Model/User';

@Controller('api/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
    private readonly logger = new Logger(BackupController.name);

    constructor(private readonly backupService: BackupService) {}

    @Post('create')
    @Roles(UserRole.ADMIN)
    async createBackup(@Body() body?: { name?: string; oplog?: boolean; dumpDbUsersAndRoles?: boolean }): Promise<BackupMetadata> {
        try {
            this.logger.log('Manual backup requested');
            const metadata = await this.backupService.createBackup({
                name: body?.name || 'manual',
                oplog: body?.oplog ?? false,
                dumpDbUsersAndRoles: body?.dumpDbUsersAndRoles ?? false,
            });
            return metadata;
        } catch (error) {
            this.logger.error(`Backup creation failed: ${error instanceof Error ? error.message : String(error)}`);
            throw new HttpException(
                `Backup failed: ${error instanceof Error ? error.message : String(error)}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('list')
    @Roles(UserRole.ADMIN)
    async listBackups(): Promise<BackupMetadata[]> {
        try {
            return await this.backupService.listBackups();
        } catch (error) {
            this.logger.error(`Failed to list backups: ${error instanceof Error ? error.message : String(error)}`);
            throw new HttpException(
                `Failed to list backups: ${error instanceof Error ? error.message : String(error)}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Delete(':filename')
    @Roles(UserRole.ADMIN)
    async deleteBackup(@Param('filename') filename: string): Promise<{ message: string }> {
        try {
            await this.backupService.deleteBackup(filename);
            return { message: `Backup ${filename} deleted successfully` };
        } catch (error) {
            this.logger.error(`Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`);
            throw new HttpException(
                `Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

