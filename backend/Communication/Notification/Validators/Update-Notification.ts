import {IsEnum, IsMongoId, IsOptional, IsString, Length} from "class-validator";
import {NotificationType} from "../Models/Notification";

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