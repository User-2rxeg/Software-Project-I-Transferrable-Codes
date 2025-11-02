
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {Logs} from "../Model/Logs";


export class PublicAuditDto {
    @ApiProperty({ example: '64b8f7a0c2f4e9b3f1a2d3c4', description: 'MongoDB ObjectId' })
    _id!: string;

    @ApiPropertyOptional({ example: '64b8f7a0c2f4e9b3f1a2d3c4' })
    userId?: string;

    @ApiProperty({ enum: Object.values(Logs) })
    event!: Logs;

    @ApiPropertyOptional({ type: Object, description: 'Additional event-specific details' })
    details?: Record<string, any>;

    @ApiProperty({ type: String, format: 'date-time' })
    timestamp!: Date;
}