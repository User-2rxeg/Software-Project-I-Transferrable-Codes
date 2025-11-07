// src/Communication/Gateway/Chat-Gateway.ts
import { Inject, forwardRef } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { ChatService } from '../Module/Chat-Service';

@WebSocketGateway({ cors: true, namespace: '/ws/chat' })
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer() server!: Server;

    constructor(
        private readonly jwt: JwtService,
        @Inject(forwardRef(() => ChatService))   // <<< important
        private readonly chatService: ChatService,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth as any)?.token ||
                client.handshake.headers.authorization?.toString().split(' ')[1];
            if (!token) return client.disconnect();

            const payload = this.jwt.verify(token);
            const userId = payload?.sub as string;
            if (!userId) return client.disconnect();

            client.join(`user:${userId}`);
            (client as any).userId = userId;

            client.on('chat:join', async (chatId: string) => {
                try {
                    if (typeof chatId === 'string' && Types.ObjectId.isValid(chatId)) {
                        await this.chatService.ensureMembership(chatId, userId);
                        client.join(`chat:${chatId}`);
                    }
                } catch {
                    /* ignore */
                }
            });

            client.on('chat:leave', (chatId: string) => {
                if (typeof chatId === 'string' && Types.ObjectId.isValid(chatId)) {
                    client.leave(`chat:${chatId}`);
                }
            });
        } catch {
            client.disconnect();
        }
    }

    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    emitToChat(chatId: string, event: string, data: any) {
        this.server.to(`chat:${chatId}`).emit(event, data);
    }
}


// NOTE: Room membership should be validated server-side.
// We only allow join/leave for rooms that the user actually belongs to.

// @WebSocketGateway({ cors: true, namespace: '/ws/chat' })
// export class ChatGateway implements OnGatewayConnection {
//     @WebSocketServer() server!: Server;
//
//     constructor(private readonly jwt: JwtService) {}
//
//     async handleConnection(client: Gateway) {
//         try {
//             const token =
//                 (client.handshake.auth as any)?.token ||
//                 (client.handshake.headers.authorization?.toString().split(' ')[1]);
//             if (!token) return client.disconnect();
//
//             const payload = this.jwt.verify(token);
//             const userId = payload?.sub as string;
//             if (!userId) return client.disconnect();
//
//             client.join(`user:${userId}`);
//             (client as any).userId = userId;
//
//             client.on('chat:join', (chatId: string) => {
//                 if (typeof chatId === 'string' && Types.ObjectId.isValid(chatId)) {
//                     client.join(`chat:${chatId}`);
//                 }
//             });
//
//             client.on('chat:leave', (chatId: string) => {
//                 if (typeof chatId === 'string' && Types.ObjectId.isValid(chatId)) {
//                     client.leave(`chat:${chatId}`);
//                 }
//             });
//         } catch {
//             client.disconnect();
//         }
//     }
//
//     emitToUser(userId: string, event: string, data: any) {
//         this.server.to(`user:${userId}`).emit(event, data);
//     }
//
//     emitToChat(chatId: string, event: string, data: any) {
//         this.server.to(`chat:${chatId}`).emit(event, data);
//     }
// }


// import { UseGuards } from '@nestjs/common';
// import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
// import { Server, Gateway } from 'socket.io';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { ChatService } from './chat.service';
//
// @WebSocketGateway({ cors: { origin: '*' } })
// export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer() server!: Server;
//
//     constructor(private readonly chat: ChatService) {}
//
//     afterInit() {}
//
//     async handleConnection(client: Gateway) {
//         // Expect JWT already verified by adapter or a handshake; alternatively implement here.
//         const userId = (client.handshake.auth?.userId || client.handshake.headers['x-user-id']) as string;
//         if (!userId) return client.disconnect();
//         client.data.userId = userId;
//         client.join(`user:${userId}`);
//     }
//
//     handleDisconnect(client: Gateway) {
//         // cleanup if needed
//     }
//
//     @UseGuards(JwtAuthGuard)
//     @SubscribeMessage('message.send')
//     async onMessageSend(@ConnectedSocket() client: Gateway, @MessageBody() payload: { conversationId: string; content?: string; attachmentUrl?: string }) {
//         const userId = client.data.userId as string;
//         const msg = await this.chat.sendMessage(payload.conversationId, userId, payload.content, payload.attachmentUrl);
//         // Emit to conversation room + each participant personal room
//         this.server.to(`conv:${payload.conversationId}`).emit('message.new', msg);
//     }
//
//     @UseGuards(JwtAuthGuard)
//     @SubscribeMessage('message.read')
//     async onMessageRead(@ConnectedSocket() client: Gateway, @MessageBody() body: { conversationId: string; upToMessageId?: string }) {
//         const userId = client.data.userId as string;
//         const res = await this.chat.markRead(body.conversationId, userId, body.upToMessageId);
//         this.server.to(`conv:${body.conversationId}`).emit('message.update', { conversationId: body.conversationId, type: 'read', userId, ...res });
//     }
// }

// import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { Server, Gateway } from 'socket.io';
// import { JwtService } from '@nestjs/jwt';
//
// @WebSocketGateway({ cors: true, namespace: '/ws/chat' })
// export class ChatGateway implements OnGatewayConnection {
//     @WebSocketServer() server!: Server;
//
//     constructor(private readonly jwt: JwtService) {}
//
//     async handleConnection(client: Gateway) {
//         try {
//             const token =
//                 (client.handshake.auth as any)?.token ||
//                 (client.handshake.headers.authorization as string | undefined)?.split(' ')[1];
//
//             if (!token) return client.disconnect();
//             const payload = this.jwt.verify(token);
//             const userId = payload?.sub as string | undefined;
//             if (!userId) return client.disconnect();
//
//             client.join(`user:${userId}`);
//             (client as any).userId = userId;
//
//             // Optional: client asks to join a conversation room; you can also auto-join server-side on list
//             client.on('conversation:join', (conversationId: string) => {
//                 if (typeof conversationId === 'string' && conversationId) {
//                     client.join(`conv:${conversationId}`);
//                 }
//             });
//             client.on('conversation:leave', (conversationId: string) => {
//                 if (typeof conversationId === 'string' && conversationId) {
//                     client.leave(`conv:${conversationId}`);
//                 }
//             });
//         } catch {
//             client.disconnect();
//         }
//     }
//
//     emitToUser(userId: string, event: string, data: any) {
//         this.server.to(`user:${userId}`).emit(event, data);
//     }
//
//     emitToConversation(conversationId: string, event: string, data: any) {
//         this.server.to(`conv:${conversationId}`).emit(event, data);
//     }
// }
