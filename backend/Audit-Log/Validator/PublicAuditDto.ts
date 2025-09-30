
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEvent } from '../Model/Audit-Log';

export class PublicAuditDto {
    @ApiProperty({ example: '64b8f7a0c2f4e9b3f1a2d3c4', description: 'MongoDB ObjectId' })
    _id!: string;

    @ApiPropertyOptional({ example: '64b8f7a0c2f4e9b3f1a2d3c4' })
    userId?: string;

    @ApiProperty({ enum: Object.values(AuditEvent) })
    event!: AuditEvent;

    @ApiPropertyOptional({ type: Object, description: 'Additional event-specific details' })
    details?: Record<string, any>;

    @ApiProperty({ type: String, format: 'date-time' })
    timestamp!: Date;
}