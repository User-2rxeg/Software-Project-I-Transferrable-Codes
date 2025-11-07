// src/feedback/dto/public-feedback.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicFeedbackDto {
    @ApiProperty({ example: '64b8f7a0c2f4e9b3f1a2d3c4', description: 'MongoDB ObjectId' })
    _id!: string;

    @ApiPropertyOptional({ example: '64b8f7a0c2f4e9b3f1a2d3c4', description: 'Optional userId if the submitter was logged in' })
    userId?: string | null;

    @ApiProperty({ example: 'I found a bug on the course page where videos stop at 3:05.' })
    message!: string;

    @ApiPropertyOptional({ example: 'alice@example.com' })
    contactEmail?: string | null;

    @ApiPropertyOptional({ example: 'bug' })
    category?: string;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt!: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt!: Date;
}
