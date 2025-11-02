
import {IsString, IsOptional, IsMongoId, IsObject, IsDate, IsEnum, Min, IsInt} from 'class-validator';
import {Type} from "class-transformer";

import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Logs} from "../Model/Logs";




export class CreateAuditLogDto {
    @ApiPropertyOptional({ description: 'Optional user id associated with the event', example: '64b8f7a0c2f4e9b3f1a2d3c4' })
    @IsMongoId()
    @IsOptional()
    userId?: string;

    @ApiProperty({ enum: Object.values(Logs), description: 'The audit event type' })
    @IsEnum(Logs)
    event!: Logs;

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
    @ApiPropertyOptional({ enum: Object.values(Logs) })
    @IsEnum(Logs)
    @IsOptional()
    event?: Logs;

    @ApiPropertyOptional({ type: Object })
    @IsObject()
    @IsOptional()
    details?: Record<string, any>;
}


export class ListAuditQueryDto {
    @ApiPropertyOptional({ enum: Object.values(Logs), description: 'Filter by event type' })
    @IsOptional()
    @IsEnum(Logs)
    event?: Logs;

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

