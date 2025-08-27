// src/DTO/AuditLog.DTO.ts
import { IsString, IsOptional, IsMongoId, IsObject, IsDate } from 'class-validator';

export class CreateAuditLogDto {
    @IsMongoId() @IsOptional()
    userId?: string;

    @IsString()
    event!: string;

    @IsObject() @IsOptional()
    details?: Record<string, any>;

    @IsDate() @IsOptional()
    timestamp?: Date; // optional; will default server-side
}

export class UpdateAuditLogDto {
    @IsString() @IsOptional()
    event?: string;

    @IsObject() @IsOptional()
    details?: Record<string, any>;
}