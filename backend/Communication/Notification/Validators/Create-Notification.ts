import {IsEnum, IsMongoId, IsOptional, IsString, Length} from "class-validator";
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