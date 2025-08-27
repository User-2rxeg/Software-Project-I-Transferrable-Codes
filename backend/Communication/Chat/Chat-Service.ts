import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../../Database/Conversation';
import { Message, MessageDocument } from '../../Database/Message';
import { User, UserDocument } from '../../Database/User';
import {ChatGateway} from "../Gateways/Chat-Gateway";
import {CreateChatDto} from "../../Validators/Chat-Validator";


type PageOpts = { page?: number; limit?: number };

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Conversation.name) private readonly convModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private readonly msgModel: Model<MessageDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly gateway: ChatGateway,
    ) {}

    private toObjId(id: string) { return new Types.ObjectId(id); }

    async createChat(dto: CreateChatDto, creatorId: string) {
        const creator = this.toObjId(creatorId);
        const members = (dto.participants ?? []).map(this.toObjId);
        if (!members.some(m => m.equals(creator))) members.push(creator);

        const count = await this.userModel.countDocuments({ _id: { $in: members } });
        if (count !== members.length) throw new NotFoundException('One or more participants not found');

        const conv = await this.convModel.create({
            participants: members,
            isGroup: !!dto.isGroup,
            groupName: dto.groupName,
            courseId: dto.courseId ? this.toObjId(dto.courseId) : undefined,
            lastReadBy: new Map<string, Types.ObjectId>(),
        });

        // Optional seed messages
        if (dto.messages?.length) {
            const docs = await this.msgModel.insertMany(
                dto.messages.map(m => ({
                    conversation: conv._id,
                    sender: this.toObjId(m.sender),
                    content: m.content,
                    attachmentUrl: m.attachementURl,
                }))
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
                .lean(),
            this.convModel.countDocuments(filter),
        ]);
        return { items, total, page, limit };
    }

    private async ensureMembership(convId: string, userId: string) {
        const conv = await this.convModel.findById(convId);
        if (!conv) throw new NotFoundException('Chat not found');
        const isMember = conv.participants.some(p => String(p) === userId);
        if (!isMember) throw new ForbiddenException('Not a member of this chat');
        return conv;
    }

    async history(chatId: string, userId: string, { page = 1, limit = 20 }: PageOpts) {
        await this.ensureMembership(chatId, userId);
        // paginate by message _id desc, return ascending
        const skip = (page - 1) * limit;
        const cursor = await this.msgModel
            .find({ conversation: this.toObjId(chatId) })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return {
            items: cursor.reverse(),
            total: await this.msgModel.countDocuments({ conversation: this.toObjId(chatId) }),
            page,
            limit,
        };
    }

    async sendMessage(chatId: string, senderId: string, content: string, attachmentUrl?: string) {
        if (!content && !attachmentUrl) throw new ForbiddenException('Empty message');
        const conv = await this.ensureMembership(chatId, senderId);

        const msg = await this.msgModel.create({
            conversation: conv._id,
            sender: this.toObjId(senderId),
            content: content?.trim(),
            attachmentUrl,
        });

        await this.convModel.findByIdAndUpdate(conv._id, {
            lastMessage: msg._id,
            lastMessageAt: msg.createdAt,
        });

        const payload = {
            chatId: String(conv._id),
            message: {
                id: String(msg._id),
                sender: String(msg.sender),
                content: msg.content,
                attachmentUrl: msg.attachmentUrl,
                timestamp: msg.createdAt,
            },
        };

        // Realtime emits
        this.gateway.emitToChat(String(conv._id), 'chat:newMessage', payload);
        conv.participants.forEach(uid => this.gateway.emitToUser(String(uid), 'chat:poke', { chatId: String(conv._id) }));

        return payload;
    }

    async markRead(chatId: string, me: string, upToMessageId?: string) {
        const conv = await this.ensureMembership(chatId, me);
        const lastId = upToMessageId ? this.toObjId(upToMessageId) : undefined;

        // Strategy: track lastReadBy[me] = last message id
        const map = conv.lastReadBy ?? new Map<string, Types.ObjectId>();
        if (lastId) map.set(me, lastId);
        else {
            const last = await this.msgModel.findOne({ conversation: conv._id }).sort({ _id: -1 }).select('_id');
            if (last) map.set(me, last._id);
        }
        conv.lastReadBy = map;
        await conv.save();

        this.gateway.emitToChat(String(conv._id), 'chat:read', { chatId, reader: me, upToMessageId });
        return { ok: true };
    }

    async getOrCreateDirect(me: string, other: string) {
        const a = this.toObjId(me), b = this.toObjId(other);
        let conv = await this.convModel.findOne({ isGroup: false, participants: { $all: [a, b], $size: 2 } });
        if (!conv) conv = await this.convModel.create({ isGroup: false, participants: [a, b] });
        return conv;
    }
}