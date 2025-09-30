import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBackupDto {
    @ApiPropertyOptional({ description: 'Optional name prefix for the backup file', example: 'nightly' })
    name?: string;

    @ApiPropertyOptional({ description: 'Optional DB name to include (maps to --db)', example: 'yourdb' })
    db?: string;

    @ApiPropertyOptional({ description: 'Include replica set oplog for consistent snapshot (maps to --oplog)', example: true })
    oplog?: boolean;

    @ApiPropertyOptional({ description: 'Include DB users & roles when dumping single DB (maps to --dumpDbUsersAndRoles)', example: false })
    dumpDbUsersAndRoles?: boolean;
}

export class BackupMetadataDto {
    @ApiProperty({ example: 'scheduled-backup-2025-09-29T17-00-00Z.gz' })
    filename!: string;

    @ApiProperty({ description: 'Absolute path to the archive' })
    path!: string;

    @ApiProperty({ description: 'File size in bytes' })
    size!: number;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt!: Date;
}
