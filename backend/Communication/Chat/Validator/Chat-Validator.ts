// src/Communication/Validator/Chat-Validator.ts
import {
    IsString,
    IsArray,
    IsMongoId,
    IsOptional,
    IsBoolean,
    ValidateNested,
    Min,
    IsInt,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MessageDto {
    @ApiProperty({ description: 'Sender user id', example: '64f1b2...' })
    @IsMongoId()
    sender!: string;

    @ApiProperty({ description: 'Message content', example: 'Hello!' })
    @IsString()
    content!: string;

    @ApiPropertyOptional({ description: 'Optional attachment URL' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}

export class CreateChatDto {
    @ApiProperty({ type: [String], description: 'Participant userIds', example: ['64f1...', '64f2...'] })
    @IsArray()
    @ArrayMinSize(1)
    @IsMongoId({ each: true })
    participants!: string[];

    @ApiPropertyOptional({ type: [MessageDto], description: 'Optional initial messages' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MessageDto)
    @IsOptional()
    messages?: MessageDto[];

    @ApiPropertyOptional({ description: 'Is group conversation?' })
    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;

    @ApiPropertyOptional({ description: 'Group name' })
    @IsString()
    @IsOptional()
    groupName?: string;

    @ApiPropertyOptional({ description: 'Optional course id' })
    @IsMongoId()
    @IsOptional()
    courseId?: string;
}

export class AddMessageDto {
    @ApiProperty({ description: 'Sender user id' })
    @IsMongoId()
    sender!: string;

    @ApiProperty({ description: 'Message content' })
    @IsString()
    content!: string;

    @ApiPropertyOptional({ description: 'Attachment URL' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}

export class SendMessageDto {
    @ApiProperty({ description: 'Chat id', example: '64f3...' })
    @IsMongoId()
    chatId!: string;

    @ApiPropertyOptional({ description: 'Message content' })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({ description: 'Attachment URL' })
    @IsString()
    @IsOptional()
    attachmentUrl?: string;
}

export class HistoryQueryDto {
    @ApiProperty({ description: 'Chat id' })
    @IsMongoId()
    chatId!: string;

    @ApiPropertyOptional({ description: 'Cursor (message id) to fetch messages before' })
    @IsOptional()
    @IsMongoId()
    before?: string;

    @ApiPropertyOptional({ description: 'Limit (default 20)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;
}

export class MarkReadDto {
    @ApiProperty({ description: 'Chat id' })
    @IsMongoId()
    chatId!: string;

    @ApiPropertyOptional({ description: 'Mark read up to message id' })
    @IsOptional()
    @IsMongoId()
    upToMessageId?: string;
}
