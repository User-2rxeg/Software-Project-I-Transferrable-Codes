import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../Models/Conversation';
import { Message, MessageDocument } from '../Models/Message';
import { User, UserDocument } from '../../../User/Model/User';
import {ChatGateway} from "../Gateway/Chat-Gateway";
import {CreateChatDto} from "../Validator/Chat-Validator";

type PageOpts = { page?: number; limit?: number; before?: string };

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private readonly msgModel: Model<MessageDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly gateway: ChatGateway,
    ) {}

    private toObjId(id: string) { return new Types.ObjectId(id); }

    async ensureMembership(convId: string, userId: string) {
        const conv = await this.convModel.findById(convId).select('_id participants').lean();
        if (!conv) throw new NotFoundException('Chat not found');
        const isMember = (conv.participants as any[]).some((p) => String(p) === userId);
        if (!isMember) throw new ForbiddenException('Not a member of this chat');
        return conv;
    }

    async createChat(dto: CreateChatDto, creatorId: string) {

        const creator = this.toObjId(creatorId);

        const set = new Set<string>((dto.participants ?? []).map(String));
        set.add(String(creator));

        const members = Array.from(set).map(this.toObjId);

        const count = await this.userModel.countDocuments({ _id: { $in: members } });
        if (count !== members.length) throw new NotFoundException('One or more participants not found');

        const conv = await this.convModel.create({
            participants: members,
            isGroup: !!dto.isGroup,
            groupName: dto.groupName,
            courseId: dto.courseId ? this.toObjId(dto.courseId) : undefined,
            lastReadBy: new Map<string, Types.ObjectId>(),
        });

        if (dto.messages?.length) {
            const docs = await this.msgModel.insertMany(
                dto.messages.map((m) => ({
                    conversation: conv._id,
                    sender: this.toObjId(m.sender),
                    content: m.content,
                    attachmentUrl: m.attachmentUrl, // fixed
                })),
            );
            const last = docs[docs.length - 1];
            await this.convModel.findByIdAndUpdate(conv._id, { lastMessage: last._id, lastMessageAt: last.createdAt });
        }

        return conv;
    }

    async listMyChats(userId: string, { page = 1, limit = 20 }: PageOpts) {
        const skip = (page - 1) * limit;
        const filter = { participants: this.toObjId(userId) };
        const [items, total] = await Promise.all([
            this.convModel
                .find(filter)
                .sort({ lastMessageAt: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('participants', 'name email role')
                .lean()
                .exec(),
            this.convModel.countDocuments(filter).exec(),
        ]);
        return { items, total, page, limit };
    }

    async history(chatId: string, userId: string, { page = 1, limit = 20, before }: PageOpts) {
        await this.ensureMembership(chatId, userId);
        const q: any = { conversation: this.toObjId(chatId) };
        if (before && Types.ObjectId.isValid(before)) q._id = { $lt: this.toObjId(before) };
        const items = await this.msgModel.find(q).sort({ _id: -1 }).limit(limit).lean().exec();
        const total = await this.msgModel.countDocuments({ conversation: this.toObjId(chatId) });
        return { items: items.reverse(), total, page, limit, cursor: items.length ? String(items[0]._id) : null };
    }

    async sendMessage(chatId: string, senderId: string, content?: string, attachmentUrl?: string) {
        if (!content && !attachmentUrl) throw new ForbiddenException('Empty message');
        await this.ensureMembership(chatId, senderId);

        const msg = await this.msgModel.create({
            conversation: this.toObjId(chatId),
            sender: this.toObjId(senderId),
            content: content?.trim(),
            attachmentUrl,
        });

        await this.convModel.findByIdAndUpdate(chatId, { lastMessage: msg._id, lastMessageAt: msg.createdAt });

        const payload = {
            chatId,
            message: {
                id: String(msg._id),
                sender: String(msg.sender),
                content: msg.content,
                attachmentUrl: msg.attachmentUrl,
                timestamp:  msg.createdAt,
            },
        };

        this.gateway.emitToChat(chatId, 'chat:newMessage', payload);
        const conv = await this.convModel.findById(chatId).select('participants').lean();
        (conv?.participants ?? []).forEach((uid: any) =>
            this.gateway.emitToUser(String(uid), 'chat:poke', { chatId }),
        );

        return payload;
    }

    async markRead(chatId: string, me: string, upToMessageId?: string) {
        await this.ensureMembership(chatId, me);
        const conv = await this.convModel.findById(chatId);
        if (!conv) throw new NotFoundException('Chat not found');

        const map = conv.lastReadBy ?? new Map<string, Types.ObjectId>();
        if (upToMessageId && Types.ObjectId.isValid(upToMessageId)) {
            map.set(me, this.toObjId(upToMessageId));
        } else {
            const last = await this.msgModel.findOne({ conversation: conv._id }).sort({ _id: -1 }).select('_id').lean();
            if (last) map.set(me, last._id as any);
        }
        conv.lastReadBy = map;
        await conv.save();

        this.gateway.emitToChat(chatId, 'chat:read', { chatId, reader: me, upToMessageId });
        return { ok: true };
    }

    async getOrCreateDirect(me: string, other: string) {
        const a = this.toObjId(me), b = this.toObjId(other);
        let conv = await this.convModel.findOne({ isGroup: false, participants: { $all: [a, b], $size: 2 } });
        if (!conv) conv = await this.convModel.create({ isGroup: false, participants: [a, b] });
        return conv;
    }
}


// type PageOpts = { page?: number; limit?: number };
//
// @Injectable()
// export class ChatService {
//     constructor(
//         @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
//         @InjectModel(Message.name) private readonly msgModel: Model<MessageDocument>,
//         @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//         private readonly gateway: ChatGateway,
//     ) {}
//
//     private toObjId(id: string) { return new Types.ObjectId(id); }
//
//     async createChat(dto: CreateChatDto, creatorId: string) {
//         const creator = this.toObjId(creatorId);
//         const members = (dto.participants ?? []).map(this.toObjId);
//         if (!members.some(m => m.equals(creator))) members.push(creator);
//
//         const count = await this.userModel.countDocuments({ _id: { $in: members } });
//         if (count !== members.length) throw new NotFoundException('One or more participants not found');
//
//         const conv = await this.convModel.create({
//             participants: members,
//             isGroup: !!dto.isGroup,
//             groupName: dto.groupName,
//             courseId: dto.courseId ? this.toObjId(dto.courseId) : undefined,
//             lastReadBy: new Map<string, Types.ObjectId>(),
//         });
//
//         // Optional seed messages
//         if (dto.messages?.length) {
//             const docs = await this.msgModel.insertMany(
//                 dto.messages.map(m => ({
//                     conversation: conv._id,
//                     sender: this.toObjId(m.sender),
//                     content: m.content,
//                     attachmentUrl: m.attachementURl,
//                 }))
//             );
//             const last = docs[docs.length - 1];
//             await this.convModel.findByIdAndUpdate(conv._id, { lastMessage: last._id, lastMessageAt: last.createdAt });
//         }
//
//         return conv;
//     }
//
//     async listMyChats(userId: string, { page = 1, limit = 20 }: PageOpts) {
//         const skip = (page - 1) * limit;
//         const filter = { participants: this.toObjId(userId) };
//         const [items, total] = await Promise.all([
//             this.convModel
//                 .find(filter)
//                 .sort({ lastMessageAt: -1, updatedAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .populate('participants', 'name email role')
//                 .lean(),
//             this.convModel.countDocuments(filter),
//         ]);
//         return { items, total, page, limit };
//     }
//
//     private async ensureMembership(convId: string, userId: string) {
//         const conv = await this.convModel.findById(convId);
//         if (!conv) throw new NotFoundException('Chat not found');
//         const isMember = conv.participants.some(p => String(p) === userId);
//         if (!isMember) throw new ForbiddenException('Not a member of this chat');
//         return conv;
//     }
//
//     async history(chatId: string, userId: string, { page = 1, limit = 20 }: PageOpts) {
//         await this.ensureMembership(chatId, userId);
//         // paginate by message _id desc, return ascending
//         const skip = (page - 1) * limit;
//         const cursor = await this.msgModel
//             .find({ conversation: this.toObjId(chatId) })
//             .sort({ _id: -1 })
//             .skip(skip)
//             .limit(limit)
//             .lean();
//
//         return {
//             items: cursor.reverse(),
//             total: await this.msgModel.countDocuments({ conversation: this.toObjId(chatId) }),
//             page,
//             limit,
//         };
//     }
//
//     async sendMessage(chatId: string, senderId: string, content: string, attachmentUrl?: string) {
//         if (!content && !attachmentUrl) throw new ForbiddenException('Empty message');
//         const conv = await this.ensureMembership(chatId, senderId);
//
//         const msg = await this.msgModel.create({
//             conversation: conv._id,
//             sender: this.toObjId(senderId),
//             content: content?.trim(),
//             attachmentUrl,
//         });
//
//         await this.convModel.findByIdAndUpdate(conv._id, {
//             lastMessage: msg._id,
//             lastMessageAt: msg.createdAt,
//         });
//
//         const payload = {
//             chatId: String(conv._id),
//             message: {
//                 id: String(msg._id),
//                 sender: String(msg.sender),
//                 content: msg.content,
//                 attachmentUrl: msg.attachmentUrl,
//                 timestamp: msg.createdAt,
//             },
//         };
//
//         // Realtime emits
//         this.gateway.emitToChat(String(conv._id), 'chat:newMessage', payload);
//         conv.participants.forEach(uid => this.gateway.emitToUser(String(uid), 'chat:poke', { chatId: String(conv._id) }));
//
//         return payload;
//     }
//
//     async markRead(chatId: string, me: string, upToMessageId?: string) {
//         const conv = await this.ensureMembership(chatId, me);
//         const lastId = upToMessageId ? this.toObjId(upToMessageId) : undefined;
//
//         // Strategy: track lastReadBy[me] = last message id
//         const map = conv.lastReadBy ?? new Map<string, Types.ObjectId>();
//         if (lastId) map.set(me, lastId);
//         else {
//             const last = await this.msgModel.findOne({ conversation: conv._id }).sort({ _id: -1 }).select('_id');
//             if (last) map.set(me, last._id);
//         }
//         conv.lastReadBy = map;
//         await conv.save();
//
//         this.gateway.emitToChat(String(conv._id), 'chat:read', { chatId, reader: me, upToMessageId });
//         return { ok: true };
//     }
//
//     async getOrCreateDirect(me: string, other: string) {
//         const a = this.toObjId(me), b = this.toObjId(other);
//         let conv = await this.convModel.findOne({ isGroup: false, participants: { $all: [a, b], $size: 2 } });
//         if (!conv) conv = await this.convModel.create({ isGroup: false, participants: [a, b] });
//         return conv;
//     }
// }




// @Injectable()
// export class ChatService {
//     constructor(
//         @InjectModel(Conversation.name) private convModel: Model<Conversation>,
//         @InjectModel(Message.name) private msgModel: Model<Message>,
//     ) {}
//
//     async isParticipant(conversationId: string, userId: string) {
//         const c = await this.convModel.findById(conversationId).select('_id participants');
//         if (!c) throw new NotFoundException('Conversation not found');
//         const ok = c.participants.some(p => p.toString() === userId);
//         if (!ok) throw new ForbiddenException('Not a participant');
//         return c;
//     }
//
//     async createConversation(participants: string[], isGroup?: boolean, name?: string) {
//         const unique = [...new Set(participants)].map(id => new Types.ObjectId(id));
//         const doc = await this.convModel.create({ participants: unique, isGroup: !!isGroup, name: name ?? null });
//         return doc;
//     }
//
//     async listConversations(userId: string, limit = 20, cursor?: string) {
//         const filter = { participants: new Types.ObjectId(userId) };
//         const query = this.convModel.find(filter).sort({ lastMessageAt: -1 }).limit(limit);
//         if (cursor) query.where('_id').lt(cursor);
//         return query.lean();
//     }
//
//     async sendMessage(conversationId: string, senderId: string, content?: string, attachmentUrl?: string) {
//         const conv = await this.isParticipant(conversationId, senderId);
//         const msg = await this.msgModel.create({
//             conversation: conv._id,
//             sender: new Types.ObjectId(senderId),
//             content: content ?? '',
//             attachmentUrl: attachmentUrl ?? null,
//             status: 'sent',
//         });
//         await this.convModel.findByIdAndUpdate(conv._id, { lastMessage: msg._id, lastMessageAt: new Date() });
//         return msg;
//     }
//
//     async listMessages(conversationId: string, userId: string, limit = 30, before?: string) {
//         await this.isParticipant(conversationId, userId);
//         const q = this.msgModel.find({ conversation: conversationId }).sort({ _id: -1 }).limit(limit);
//         if (before) q.where('_id').lt(before);
//         const items = await q.lean();
//         return items.reverse();
//     }
//
//     async markRead(conversationId: string, userId: string, upToMessageId?: string) {
//         await this.isParticipant(conversationId, userId);
//         const filter: any = { conversation: conversationId, readBy: { $ne: new Types.ObjectId(userId) } };
//         if (upToMessageId) filter._id = { $lte: new Types.ObjectId(upToMessageId) };
//         await this.msgModel.updateMany(filter, { $push: { readBy: new Types.ObjectId(userId) }, $set: { status: 'read' } });
//         // Return unread count after update
//         const remaining = await this.msgModel.countDocuments({ conversation: conversationId, readBy: { $ne: userId } });
//         return { unreadRemaining: remaining };
//     }
// }


// import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Conversation, ConversationDocument } from '../../Model/chat/conversation.schema';
// import { Message, MessageDocument } from '../../Model/chat/message.schema';
// import { CreateConversationDto, SendMessageDto } from '../../dto/chat/chat.dto';
// import { ChatGateway } from './chat.gateway';
//
// @Injectable()
// export class ChatService {
//     constructor(
//         @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
//         @InjectModel(Message.name) private readonly msgModel: Model<MessageDocument>,
//         private readonly gateway: ChatGateway,
//     ) {}
//
//     private async ensureMembership(conversationId: string, userId: string) {
//         const c = await this.convModel.findById(conversationId);
//         if (!c) throw new NotFoundException('Conversation not found');
//         const ok = c.participants.some(p => String(p) === userId);
//         if (!ok) throw new ForbiddenException('Not a member');
//         return c;
//     }
//
//     async createConversation(dto: CreateConversationDto, creatorId: string) {
//         const ids = new Set<string>(dto.participants ?? []);
//         ids.add(creatorId);
//         const participants = [...ids].map(id => new Types.ObjectId(id));
//
//         const c = await this.convModel.create({
//             participants,
//             isGroup: !!dto.isGroup,
//             groupName: dto.groupName,
//             courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
//             lastReadBy: {},
//         });
//         return c;
//     }
//
//     async listMyConversations(userId: string, limit = 20, cursor?: string) {
//         const filter = { participants: new Types.ObjectId(userId) };
//         const q = this.convModel.find(filter).sort({ lastMessageAt: -1, _id: -1 }).limit(limit);
//         if (cursor) q.where('_id').lt(new Types.ObjectId(cursor));
//         return q.lean();
//     }
//
//     async sendMessage(senderId: string, dto: SendMessageDto) {
//         if (!dto.content && !dto.attachmentUrl) {
//             throw new ForbiddenException('Empty message');
//         }
//         const c = await this.ensureMembership(dto.conversationId, senderId);
//
//         const msg = await this.msgModel.create({
//             conversation: c._id,
//             sender: new Types.ObjectId(senderId),
//             content: dto.content?.trim(),
//             attachmentUrl: dto.attachmentUrl ?? undefined,
//             readBy: [], // readers (optional)
//         });
//
//         await this.convModel.findByIdAndUpdate(c._id, {
//             $set: { lastMessage: msg._id, lastMessageAt: msg.createdAt },
//         });
//
//         const payload = {
//             id: String(msg._id),
//             conversationId: String(c._id),
//             sender: senderId,
//             content: msg.content,
//             attachmentUrl: msg.attachmentUrl,
//             createdAt: msg.createdAt,
//         };
//
//         // realtime to conversation room + each participant
//         this.gateway.emitToConversation(String(c._id), 'message:new', payload);
//         c.participants.forEach(uid => this.gateway.emitToUser(String(uid), 'message:new', payload));
//
//         return payload;
//     }
//
//     async listMessages(conversationId: string, userId: string, limit = 30, before?: string) {
//         await this.ensureMembership(conversationId, userId);
//         const filter: any = { conversation: new Types.ObjectId(conversationId) };
//         if (before) filter._id = { $lt: new Types.ObjectId(before) };
//         const items = await this.msgModel.find(filter).sort({ _id: -1 }).limit(limit).lean();
//         return items.reverse(); // chronological
//     }
//
//     // Set user's lastRead pointer; cheap unread calculation
//     async markRead(conversationId: string, userId: string, upToMessageId?: string) {
//         await this.ensureMembership(conversationId, userId);
//         const update: any = {};
//         if (upToMessageId) {
//             update.$set = { [`lastReadBy.${userId}`]: new Types.ObjectId(upToMessageId) };
//         } else {
//             // if not provided, set to latest message
//             const latest = await this.msgModel.findOne({ conversation: conversationId }).sort({ _id: -1 }).lean();
//             if (latest) update.$set = { [`lastReadBy.${userId}`]: latest._id };
//         }
//         if (update.$set) {
//             await this.convModel.findByIdAndUpdate(conversationId, update);
//             this.gateway.emitToConversation(conversationId, 'message:read', { conversationId, userId, upToMessageId });
//         }
//         return { ok: true };
//     }
// }