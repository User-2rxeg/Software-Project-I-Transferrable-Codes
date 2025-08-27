// src/DTO/BackUpDTO.ts
import { IsString, IsIn, IsOptional } from 'class-validator';

export class RunBackupDTO {
    @IsString()
    @IsIn(['users', 'courses', 'performances', 'all'])
    dataType!: 'users' | 'courses' | 'performances' | 'all';
}

export class UpdateBackupDTO {
    @IsOptional() @IsString()
    storageLink?: string;

    @IsOptional()
    @IsIn(['users', 'courses', 'performances', 'all'])
    dataType?: 'users' | 'courses' | 'performances' | 'all';
}