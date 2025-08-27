import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../Authentication/Guards/AuthGuard';

import { CreateChatDto } from '../../Validators/Chat-Validator';
import { ChatService } from './Chat-Service';
import { CurrentUser } from '../../Authentication/Decorators/Current-User';
import {JwtPayload} from "../../Authentication/Interfaces/JWT-Payload.Interface";
import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
    constructor(private readonly svc: ChatService) {}

    @Post('rooms')
    createRoom(@Body() dto: CreateChatDto, @CurrentUser() me: JwtPayload) {
        return this.svc.createChat(dto, me.sub);
    }

    @Get('rooms')
    myRooms(
        @CurrentUser() me: JwtPayload,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.svc.listMyChats(me.sub, { page, limit });
    }

    @Get(':chatId/history')
    history(
        @Param('chatId') chatId: string,
        @CurrentUser() me: JwtPayload,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.svc.history(chatId, me.sub, { page, limit });
    }

    @Post(':chatId/messages')
    sendMessage(
        @Param('chatId') chatId: string,
        @Body('content') content: string,
        @Body('attachmentUrl') attachmentUrl: string | undefined,
        @CurrentUser() me: JwtPayload,
    ) {
        return this.svc.sendMessage(chatId, me.sub, content, attachmentUrl);
    }

    @Post(':chatId/read')
    markRead(
        @Param('chatId') chatId: string,
        @Body('upToMessageId') upToMessageId: string | undefined,
        @CurrentUser() me: JwtPayload,
    ) {
        return this.svc.markRead(chatId, me.sub, upToMessageId);
    }

    @Post('dm/:otherUserId')
    getOrCreateDM(@Param('otherUserId') other: string, @CurrentUser() me: JwtPayload) {
        return this.svc.getOrCreateDirect(me.sub, other);
    }
}