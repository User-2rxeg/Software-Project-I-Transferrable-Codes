import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '../Models/Conversation';
import { Message, MessageSchema } from '../Models/Message';
import { User, UserSchema } from '../../../User/Model/User';
import { ChatController } from './Chat-Controller';
import { ChatService } from './Chat-Service';
import { ChatGateway } from '../Gateway/Chat-Gateway';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../Authentication/Module/Authentication-Module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Conversation.name, schema: ConversationSchema },
            { name: Message.name, schema: MessageSchema },
            { name: User.name, schema: UserSchema },
        ]),
        forwardRef(() => AuthModule),
        JwtModule.register({}),
    ],
    controllers: [ChatController],
    providers: [
        ChatService,
        ChatGateway,
    ],
    exports: [ChatService],
})
export class ChatModule {}


