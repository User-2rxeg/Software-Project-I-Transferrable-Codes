import {IsEnum, IsMongoId, IsOptional, IsString, Length} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {NotificationType} from "../Models/Notification";


export class CreateNotificationDto {
    @ApiProperty({ description: 'Recipient user id', example: '64f1b2...' })
    @IsMongoId()
    recipientId!: string;

    @ApiProperty({ description: 'Notification type', enum: Object.values(NotificationType) })
    @IsEnum(NotificationType)
    type!: NotificationType;

    @ApiProperty({ description: 'Notification message', minLength: 1, maxLength: 2000 })
    @IsString()
    @Length(1, 2000)
    message!: string;

    @ApiPropertyOptional({ description: 'Related course id (optional)', example: '64f3...' })
    @IsOptional()
    @IsMongoId()
    courseId?: string;
}


export class UpdateNotificationDto {
    @ApiPropertyOptional({ description: 'Notification type', enum: Object.values(NotificationType) })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiPropertyOptional({ description: 'Notification message', minLength: 1, maxLength: 2000 })
    @IsOptional()
    @IsString()
    @Length(1, 2000)
    message?: string;

    @ApiPropertyOptional({ description: 'Related course id (optional)' })
    @IsOptional()
    @IsMongoId()
    courseId?: string;
}


export class NotificationDto {
    @ApiProperty({ description: 'Notification id', example: '650...' })
    _id!: string;

    @ApiProperty({ description: 'Recipient user id' })
    recipientId!: string;

    @ApiProperty({ description: 'Type of notification' })
    type!: NotificationType;

    @ApiProperty({ description: 'Notification message' })
    message!: string;

    @ApiPropertyOptional({ description: 'Related course id' })
    courseId?: string;

    @ApiProperty({ description: 'Was the notification read?' })
    read!: boolean;

    @ApiProperty({ description: 'When created', type: String, format: 'date-time' })
    createdAt!: Date;
}
/**
 * Audit entry DTO (for notifications audit)
 */
export class NotificationAuditDto {
    @ApiProperty({ description: 'Audit id' })
    _id!: string;

    @ApiProperty({ description: 'Notification id' })
    notificationId!: string;

    @ApiProperty({ description: 'Event type', example: 'SENT' })
    eventType!: string;

    @ApiProperty({ description: 'Actor user id (who triggered it)' })
    userId!: string;

    @ApiProperty({ description: 'Timestamp', type: String, format: 'date-time' })
    createdAt!: Date;
}