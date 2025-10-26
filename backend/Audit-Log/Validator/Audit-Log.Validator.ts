
import {IsString, IsOptional, IsMongoId, IsObject, IsDate, IsEnum, Min, IsInt} from 'class-validator';
import {Type} from "class-transformer";
import {AuditEvent} from "../Model/Audit-Log";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";



export class CreateAuditLogDto {
    @ApiPropertyOptional({ description: 'Optional user id associated with the event', example: '64b8f7a0c2f4e9b3f1a2d3c4' })
    @IsMongoId()
    @IsOptional()
    userId?: string;

    @ApiProperty({ enum: Object.values(AuditEvent), description: 'The audit event type' })
    @IsEnum(AuditEvent)
    event!: AuditEvent;

    @ApiPropertyOptional({ type: Object, description: 'Arbitrary event details (should be JSON serializable)' })
    @IsObject()
    @IsOptional()
    details?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Optional timestamp (server will set default if omitted)', type: String, format: 'date-time' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    timestamp?: Date;
}


export class UpdateAuditLogDto {
    @ApiPropertyOptional({ enum: Object.values(AuditEvent) })
    @IsEnum(AuditEvent)
    @IsOptional()
    event?: AuditEvent;

    @ApiPropertyOptional({ type: Object })
    @IsObject()
    @IsOptional()
    details?: Record<string, any>;
}


export class ListAuditQueryDto {
    @ApiPropertyOptional({ enum: Object.values(AuditEvent), description: 'Filter by event type' })
    @IsOptional()
    @IsEnum(AuditEvent)
    event?: AuditEvent;

    @ApiPropertyOptional({ example: '64b8f7a0c2f4e9b3f1a2d3c4' })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}

