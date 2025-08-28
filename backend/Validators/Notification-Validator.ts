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


//export class CreateNotificationDto {
    //@IsMongoId()
    //user!: string;

    //@IsString() @IsIn(['system', 'message', 'course', 'alert'])
    //type!: 'system' | 'message' | 'course' | 'alert';

    //@IsString()
    //title!: string;

    //@IsOptional() @IsString()
    //body?: string;

    //@IsOptional() @IsString()
    //link?: string;

    //@IsOptional()
  //  data?: Record<string, any>;
//}


