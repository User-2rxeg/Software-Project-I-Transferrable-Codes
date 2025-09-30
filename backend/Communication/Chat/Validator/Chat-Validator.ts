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




// // ChatDto.ts
// import {
//     IsString,
//     IsArray,
//     IsMongoId,
//     IsOptional,
//     IsBoolean,
//     ValidateNested, Min, IsInt, ArrayMinSize,
// } from 'class-validator';


// import { Type } from 'class-transformer';
//
// class MessageDto {
//     @IsMongoId()
//     sender!: string;
//
//     @IsString()
//     content!: string;
//
//     @IsOptional()
//     @IsString()
//     attachmentUrl?: string; // fixed spelling
// }
//
// export class CreateChatDto {
//     @IsArray()
//     @ArrayMinSize(1)
//     @IsMongoId({ each: true })
//     participants!: string[];
//
//     @IsArray()
//     @ValidateNested({ each: true })
//     @Type(() => MessageDto)
//     @IsOptional()
//     messages?: MessageDto[];
//
//     @IsBoolean()
//     @IsOptional()
//     isGroup?: boolean;
//
//     @IsString()
//     @IsOptional()
//     groupName?: string;
//
//     @IsMongoId()
//     @IsOptional()
//     courseId?: string;
// }
//
// export class AddMessageDto {
//     @IsMongoId()
//     sender!: string;
//
//     @IsString()
//     content!: string;
//
//     @IsOptional()
//     @IsString()
//     attachmentUrl?: string;
// }
//
// export class SendMessageDto {
//     @IsMongoId()
//     chatId!: string;
//
//     @IsString()
//     @IsOptional()
//     content?: string;
//
//     @IsString()
//     @IsOptional()
//     attachmentUrl?: string;
// }
//
// export class HistoryQueryDto {
//     @IsMongoId()
//     chatId!: string;
//
//     @IsOptional()
//     @IsMongoId()
//     before?: string; // cursor (message _id)
//
//     @IsOptional()
//     @IsInt()
//     @Min(1)
//     limit?: number; // default 20
// }
//
// export class MarkReadDto {
//     @IsMongoId()
//     chatId!: string;
//
//     @IsOptional()
//     @IsMongoId()
//     upToMessageId?: string;
// }
//
// // class MessageDto {
// //     @IsMongoId()
// //     sender!: string;
// //
// //     @IsString()
// //     content!: string;
// //
// //     @IsOptional()
// //     @IsString()
// //     attachementURl?: string;
// // }
// //
// // export class CreateChatDto {
// //     @IsArray()
// //     @IsMongoId({ each: true })
// //     participants!: string[];
// //
// //     @IsArray()
// //     @ValidateNested({ each: true })
// //     @Type(() => MessageDto)
// //     @IsOptional()
// //     messages?: MessageDto[];
// //
// //     @IsBoolean()
// //     @IsOptional()
// //     isGroup?: boolean;
// //
// //     @IsString()
// //     @IsOptional()
// //     groupName?: string;
// //
// //     @IsMongoId()
// //     @IsOptional()
// //     courseId?: string;
// // }
// //
// // export class AddMessageDto {
// //     @IsMongoId()
// //     sender!: string;
// //
// //     @IsString()
// //     content!: string;
// // }
// //
// // export class UpdateChatDto extends CreateChatDto {}
//
//
// //export class CreateConversationDto {
//     //@IsArray() @ArrayMinSize(1) @IsMongoId({ each: true })
//     //participants!: string[];
//
//     //@IsOptional() @IsBoolean()
//     //isGroup?: boolean;
//
//     //@IsOptional() @IsString()
//   //  name?: string;
// //}
//
//
// //export class SendMessageDto {
//     //@IsMongoId()
//     //conversationId!: string;
//
//     //@IsOptional() @IsString()
//     //content?: string;
//
//     //@IsOptional() @IsString()
//   //  attachmentUrl?: string;
// //}
//
// // export class CreateConversationDto {
// //     @IsArray() @ArrayMinSize(1) @IsMongoId({ each: true })
// //     participants!: string[];
// //
// //     @IsBoolean() @IsOptional()
// //     isGroup?: boolean;
// //
// //     @IsString() @IsOptional()
// //     groupName?: string;
// //
// //     @IsMongoId() @IsOptional()
// //     courseId?: string;
// // }
// //
// // export class SendMessageDto {
// //     @IsMongoId()
// //     conversationId!: string;
// //
// //     @IsString() @IsOptional()
// //     content?: string;
// //
// //     @IsString() @IsOptional()
// //     attachmentUrl?: string;
// // }
// //
// // export class ListMessagesQueryDto {
// //     @IsMongoId()
// //     conversationId!: string;
// //
// //     // use cursor pagination (id before which to fetch)
// //     @IsMongoId() @IsOptional()
// //     before?: string;
// //
// //     @IsOptional()
// //     limit?: number;
// // }
// //
// // export class MarkReadDto {
// //     @IsMongoId()
// //     conversationId!: string;
// //
// //     // set lastRead up to this message (inclusive)
// //     @IsMongoId() @IsOptional()
// //     upToMessageId?: string;
// // }
//
//
// // class MessageDto {
// //     @IsMongoId()
// //     sender!: string;
// //
// //     @IsString()
// //     content!: string;
// //
// //     @IsString()
// //     @IsOptional()
// //     attachmentUrl?: string;
// // }
// //
// // export class CreateChatDto {
// //     @IsArray()
// //     @IsMongoId({ each: true })
// //     participants!: string[];
// //
// //     @IsArray()
// //     @ValidateNested({ each: true })
// //     @Type(() => MessageDto)
// //     @IsOptional()
// //     messages?: MessageDto[];
// //
// //     @IsBoolean()
// //     @IsOptional()
// //     isGroup?: boolean;
// //
// //     @IsString()
// //     @IsOptional()
// //     groupName?: string;
// //
// //     @IsMongoId()
// //     @IsOptional()
// //     courseId?: string;
// // }