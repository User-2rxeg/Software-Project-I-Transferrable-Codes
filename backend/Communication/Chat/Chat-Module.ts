import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../../Database/Conversation';
import { Message, MessageSchema } from '../../Database/Message';
import { User, UserSchema } from '../../Database/User';

import { ChatController } from './Chat-Controller';
import { ChatService } from './Chat-Service';

import { JwtModule } from '@nestjs/jwt';
import {ChatGateway} from "../Gateways/Chat-Gateway";
import {AuthModule} from "../../Authentication/Module/Authentication-Module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Conversation.name, schema: ConversationSchema },
            { name: Message.name, schema: MessageSchema },
            { name: User.name, schema: UserSchema },
        ]),
        AuthModule,
        JwtModule.register({}), // ensure same secret as HTTP auth
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule {}