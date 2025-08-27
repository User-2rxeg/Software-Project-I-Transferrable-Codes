// ChatDto.ts
import {
    IsString,
    IsArray,
    IsMongoId,
    IsOptional,
    IsBoolean,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
    @IsMongoId()
    sender!: string;

    @IsString()
    content!: string;

    @IsOptional()
    @IsString()
    attachementURl?: string;
}

export class CreateChatDto {
    @IsArray()
    @IsMongoId({ each: true })
    participants!: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MessageDto)
    @IsOptional()
    messages?: MessageDto[];

    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;

    @IsString()
    @IsOptional()
    groupName?: string;

    @IsMongoId()
    @IsOptional()
    courseId?: string;
}

export class AddMessageDto {
    @IsMongoId()
    sender!: string;

    @IsString()
    content!: string;
}

export class UpdateChatDto extends CreateChatDto {}
