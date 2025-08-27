// src/DTO/NotificationDTO.ts
import {IsString, IsMongoId, IsOptional, IsEnum} from 'class-validator';

export class CreateNotificationDto {
    @IsMongoId()
    recipientId!: string;         // string, not Types.ObjectId

    @IsEnum(['announcement\'|\'courseUpdate\' | \'assignmentDue\' | \'newMessage\' | \'systemAlert\' | \'other\''])
    type!: 'announcement' | 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'other';

    @IsString()
    message!: string;

    @IsMongoId()
    @IsOptional()
    courseId?: string;            // optional
}

// For updates, do not allow client to set read/createdAt/sentBy directly
export class UpdateNotificationDto {
    @IsEnum(['announcement', 'courseUpdate', 'assignmentDue', 'newMessage', 'systemAlert', 'other'])
    @IsOptional()
    type?: 'announcement' | 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'other';

    @IsString()
    @IsOptional()
    message?: string;

    @IsMongoId()
    @IsOptional()
    courseId?: string;
}