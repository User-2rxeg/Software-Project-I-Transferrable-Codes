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
        forwardRef(() => AuthModule),     // <<< if there’s a loop, use forwardRef
        JwtModule.register({}),           // shares secret via AuthModule’s config
    ],
    controllers: [ChatController],
    providers: [
        ChatService,
        ChatGateway,
    ],
    exports: [ChatService],             // export if other modules need it
})
export class ChatModule {}

// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: Conversation.name, schema: ConversationSchema },
//             { name: Message.name, schema: MessageSchema },
//             { name: User.name, schema: UserSchema },
//         ]),
//         AuthModule,
//         JwtModule.register({}), // ensure same secret as HTTP auth
//     ],
//     controllers: [ChatController],
//     providers: [ChatService, ChatGateway],
//     exports: [ChatService],
// })
// export class ChatModule {}





//@Module({
    //imports: [
        //forwardRef(() => AuthModule),
        //MongooseModule.forFeature([
          //  { name: Conversation.name, schema: ConversationSchema },
        //    { name: Message.name, schema: MessageSchema },
      //  ]),
    //],
    //providers: [ChatService, ChatGateway],
    //controllers: [ChatController],
  //  exports: [ChatService],
//})
//export class ChatModule {}


//import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from '@nestjs/jwt';
//
// import { Conversation, ConversationSchema } from '../../Model/chat/conversation.schema';
// import { Message, MessageSchema } from '../../Model/chat/message.schema';
// import { ChatService } from './chat.service';
// import { ChatController } from './chat.controller';
// import { ChatGateway } from './chat.gateway';
// import { AuthModule } from '../../Authentication/AuthModule';
//
// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: Conversation.name, schema: ConversationSchema },
//             { name: Message.name, schema: MessageSchema },
//         ]),
//         AuthModule,
//         JwtModule.register({}),
//     ],
//     controllers: [ChatController],
//     providers: [ChatService, ChatGateway],
//     exports: [ChatService],
// })
// export class ChatModule {}
