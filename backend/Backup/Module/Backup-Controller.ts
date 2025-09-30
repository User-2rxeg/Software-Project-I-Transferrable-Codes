import {
    Controller,
    Post,
    Body,
    Get,
    Delete,
    Param,
    Res,
    HttpStatus,
    HttpCode,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { Response } from 'express';
import {JwtAuthGuard} from "../../Authentication/Guards/Auth-Guard";
import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
import {BackupMetadataDto, CreateBackupDto} from "../DTO/Backup-DTO";
import {BackupService} from "./Backup-Service";


@UseGuards(JwtAuthGuard,RolesGuard)
@ApiTags('backups')
@Controller('backups')
export class BackupController {
    constructor(private readonly svc: BackupService) {}

    @Post()
    @ApiOperation({ summary: 'Create a manual backup (runs mongodump)' })
    @ApiBody({ type: CreateBackupDto, required: false })
    @ApiCreatedResponse({ type: BackupMetadataDto })
    async create(@Body() body?: CreateBackupDto) {
        const meta = await this.svc.createBackup(body ?? {});
        return meta;
    }

    @Get()
    @ApiOperation({ summary: 'List available backups' })
    @ApiOkResponse({ type: [BackupMetadataDto] })
    async list(): Promise<BackupMetadataDto[]> {
        return this.svc.listBackups();
    }

    @Get('download/:filename')
    @ApiOperation({ summary: 'Download a backup archive' })
    async download(@Param('filename') filename: string, @Res() res: Response) {
        const list = await this.svc.listBackups();
        const found = list.find((f) => f.filename === filename);
        if (!found) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
        }
        return res.download(found.path, found.filename);
    }

    @Delete(':filename')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a backup archive' })
    async remove(@Param('filename') filename: string) {
        await this.svc.deleteBackup(filename);
    }
}
