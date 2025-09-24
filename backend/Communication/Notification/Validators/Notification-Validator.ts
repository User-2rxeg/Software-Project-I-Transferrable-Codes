import { IsEnum, IsMongoId, IsOptional, IsString, Length } from 'class-validator';
import {NotificationType} from "../Models/Notification";


export class CreateNotificationDto {
    @IsMongoId()
    recipientId!: string;

    @IsEnum(NotificationType)
    type!: NotificationType;

    @IsString()
    @Length(1, 2000)
    message!: string;

    @IsOptional()
    @IsMongoId()
    courseId?: string;
}

export class UpdateNotificationDto {
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @IsOptional()
    @IsString()
    @Length(1, 2000)
    message?: string;

    @IsOptional()
    @IsMongoId()
    courseId?: string;
}

















// src/Validator/NotificationDTO.ts
//import {IsString, IsMongoId, IsOptional, IsEnum} from 'class-validator';

// export class CreateNotificationDto {
//     @IsMongoId()
//     recipientId!: string;         // string, not Types.ObjectId
//
//     @IsEnum(['announcement\'|\'courseUpdate\' | \'assignmentDue\' | \'newMessage\' | \'systemAlert\' | \'other\''])
//     type!: 'announcement' | 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'other';
//
//     @IsString()
//     message!: string;
//
//     @IsMongoId()
//     @IsOptional()
//     courseId?: string;            // optional
// }
//
// // For updates, do not allow client to set read/createdAt/sentBy directly
// export class UpdateNotificationDto {
//     @IsEnum(['announcement', 'courseUpdate', 'assignmentDue', 'newMessage', 'systemAlert', 'other'])
//     @IsOptional()
//     type?: 'announcement' | 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'other';
//
//     @IsString()
//     @IsOptional()
//     message?: string;
//
//     @IsMongoId()
//     @IsOptional()
//     courseId?: string;
// }


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



// export class CreateNotificationDto {
//     @IsMongoId()
//     recipientId!: string;
//
//     @IsEnum(['announcement', 'message', 'system', 'course'])
//     type!: 'announcement' | 'message' | 'system' | 'course';
//
//     @IsString()
//     message!: string;
//
//     @IsMongoId()
//     @IsOptional()
//     courseId?: string;
// }
//
// export class UpdateNotificationDto {
//     @IsEnum(['announcement', 'message', 'system', 'course'])
//     @IsOptional()
//     type?: 'announcement' | 'message' | 'system' | 'course';
//
//     @IsString()
//     @IsOptional()
//     message?: string;
//
//     @IsMongoId()
//     @IsOptional()
//     courseId?: string;
// }
