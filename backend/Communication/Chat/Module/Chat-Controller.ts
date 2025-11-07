import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';

import {CreateChatDto, HistoryQueryDto, MarkReadDto, SendMessageDto} from '../Validator/Chat-Validator';
import { ChatService } from './Chat-Service';
import { CurrentUser } from '../../../Authentication/Decorators/Current-User';

import {RolesGuard} from "../../../Authentication/Guards/Roles-Guard";
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiExtraModels, ApiOkResponse,
    ApiOperation, ApiParam,
    ApiQuery,
    ApiTags
} from '@nestjs/swagger';
import {JwtAuthGuard} from "../../../Authentication/Guards/Authentication-Guard";
import {JwtPayload} from "../../../Authentication/Interfaces/JWT-Payload";

// Optional: if you have Chat response DTOs, include them in ApiExtraModels
@ApiTags('chat')
@ApiBearerAuth('access-token')
@ApiExtraModels(CreateChatDto, SendMessageDto, HistoryQueryDto, MarkReadDto)
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
    constructor(private readonly svc: ChatService) {}

    @Post('rooms')
    @ApiOperation({ summary: 'Create a chat room / conversation' })
    @ApiBody({ type: CreateChatDto })
    @ApiCreatedResponse({ description: 'Chat created' })
    createRoom(@Body() dto: CreateChatDto, @CurrentUser() me: JwtPayload) {
        return this.svc.createChat(dto, me.sub);
    }

    @Get('rooms')
    @ApiOperation({ summary: 'List my chat rooms' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponse({ description: 'List of chats' })
    myRooms(
        @CurrentUser() me: JwtPayload,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.svc.listMyChats(me.sub, { page, limit });
    }

    @Get(':chatId/history')
    @ApiOperation({ summary: 'Get chat history (cursor pagination)' })
    @ApiParam({ name: 'chatId', required: true, type: String })
    @ApiQuery({ name: 'before', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponse({ description: 'List of messages' })
    history(
        @Param('chatId') chatId: string,
        @CurrentUser() me: JwtPayload,
        @Query('before') before?: string,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    ) {
        return this.svc.history(chatId, me.sub, { limit, before });
    }

    @Post(':chatId/messages')
    @ApiOperation({ summary: 'Send message to chat' })
    @ApiParam({ name: 'chatId', required: true, type: String })
    @ApiBody({ type: SendMessageDto })
    @ApiCreatedResponse({ description: 'Message sent' })
    sendMessage(
        @Param('chatId') chatId: string,
        @Body() body: Omit<SendMessageDto, 'chatId'>,
        @CurrentUser() me: JwtPayload,
    ) {
        return this.svc.sendMessage(chatId, me.sub, body.content, body.attachmentUrl);
    }

    @Post(':chatId/read')
    @ApiOperation({ summary: 'Mark messages as read up to given message id' })
    @ApiParam({ name: 'chatId', required: true, type: String })
    @ApiBody({ type: MarkReadDto })
    @ApiOkResponse({ description: 'Marked as read' })
    markRead(
        @Param('chatId') chatId: string,
        @Body() body: Omit<MarkReadDto, 'chatId'>,
        @CurrentUser() me: JwtPayload,
    ) {
        return this.svc.markRead(chatId, me.sub, body.upToMessageId);
    }

    @Post('dm/:otherUserId')
    @ApiOperation({ summary: 'Get or create direct message conversation with another user' })
    @ApiParam({ name: 'otherUserId', required: true, type: String })
    @ApiOkResponse({ description: 'Conversation returned' })
    getOrCreateDM(@Param('otherUserId') other: string, @CurrentUser() me: JwtPayload) {
        return this.svc.getOrCreateDirect(me.sub, other);
    }
}



// @Controller('chat')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class ChatController {
//     constructor(private readonly svc: ChatService) {}
//
//     @Post('rooms')
//     createRoom(@Body() dto: CreateChatDto, @CurrentUser() me: JwtPayload) {
//         return this.svc.createChat(dto, me.sub);
//     }
//
//     @Get('rooms')
//     myRooms(
//         @CurrentUser() me: JwtPayload,
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
//     ) {
//         return this.svc.listMyChats(me.sub, { page, limit });
//     }
//
//     @Get(':chatId/history')
//     history(
//         @Param('chatId') chatId: string,
//         @CurrentUser() me: JwtPayload,
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
//     ) {
//         return this.svc.history(chatId, me.sub, { page, limit });
//     }
//
//     @Post(':chatId/messages')
//     sendMessage(
//         @Param('chatId') chatId: string,
//         @Body('content') content: string,
//         @Body('attachmentUrl') attachmentUrl: string | undefined,
//         @CurrentUser() me: JwtPayload,
//     ) {
//         return this.svc.sendMessage(chatId, me.sub, content, attachmentUrl);
//     }
//
//     @Post(':chatId/read')
//     markRead(
//         @Param('chatId') chatId: string,
//         @Body('upToMessageId') upToMessageId: string | undefined,
//         @CurrentUser() me: JwtPayload,
//     ) {
//         return this.svc.markRead(chatId, me.sub, upToMessageId);
//     }
//
//     @Post('dm/:otherUserId')
//     getOrCreateDM(@Param('otherUserId') other: string, @CurrentUser() me: JwtPayload) {
//         return this.svc.getOrCreateDirect(me.sub, other);
//     }
// }




// @Controller('chat')
// @UseGuards(JwtAuthGuard)
// export class ChatController {
//     constructor(private readonly chat: ChatService) {}
//
//     @Post('conversations')
//     createConversation(@Body() dto: CreateConversationDto) {
//         return this.chat.createConversation(dto.participants, dto.isGroup, dto.name);
//     }
//
//     @Get('conversations')
//     listConversations(@CurrentUser() user: any, @Query('limit') limit = 20, @Query('cursor') cursor?: string) {
//         return this.chat.listConversations(user.userId, Number(limit), cursor);
//     }
//
//     @Get('messages')
//     listMessages(@CurrentUser() user: any, @Query('conversationId') conversationId: string, @Query('limit') limit = 30, @Query('before') before?: string) {
//         return this.chat.listMessages(conversationId, user.userId, Number(limit), before);
//     }
//
//     @Post('messages')
//     async sendMessage(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
//         return this.chat.sendMessage(dto.conversationId, user.userId, dto.content, dto.attachmentUrl);
//     }
//
//     @Post('read')
//     async markRead(@CurrentUser() user: any, @Body() body: { conversationId: string; upToMessageId?: string }) {
//         return this.chat.markRead(body.conversationId, user.userId, body.upToMessageId);
//     }



// @Controller('chat')
// @UseGuards(JwtAuthGuard)
// export class ChatController {
//     constructor(private readonly svc: ChatService) {}
//
//     @Post('conversations')
//     createConversation(@Body() dto: CreateConversationDto, @CurrentUser() me: JwtPayload) {
//         return this.svc.createConversation(dto, me.sub);
//     }
//
//     @Get('conversations')
//     listMyConversations(@CurrentUser() me: JwtPayload, @Query('limit') limit = '20', @Query('cursor') cursor?: string) {
//         return this.svc.listMyConversations(me.sub, Number(limit), cursor);
//     }
//
//     @Post('messages')
//     sendMessage(@Body() dto: SendMessageDto, @CurrentUser() me: JwtPayload) {
//         return this.svc.sendMessage(me.sub, dto);
//     }
//
//     @Get('messages')
//     listMessages(@Query() q: ListMessagesQueryDto, @CurrentUser() me: JwtPayload) {
//         return this.svc.listMessages(q.conversationId, me.sub, Number(q.limit ?? 30), q.before);
//     }
//
//     @Post('read')
//     markRead(@Body() dto: MarkReadDto, @CurrentUser() me: JwtPayload) {
//         return this.svc.markRead(dto.conversationId, me.sub, dto.upToMessageId);
//     }
// }