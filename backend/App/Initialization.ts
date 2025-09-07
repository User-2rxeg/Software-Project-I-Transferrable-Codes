// src/seed/seed.ts
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserSchema, UserDocument, UserRole } from '../Database/User';
import { Conversation, ConversationSchema, ConversationDocument } from '../Database/Conversation';
import { Message, MessageSchema, MessageDocument } from '../Database/Message';
import { Notification, NotificationSchema, NotificationDocument, NotificationType } from '../Database/Notification';
import { AuditLog, AuditLogSchema, AuditLogDocument, AuditEvent } from '../Database/Audit-Log';
// If you don’t need Feedback, remove these two lines and related code.

import { BlacklistedToken, BlacklistedTokenSchema } from '../Database/Token';
import {Feedback, FeedbackDocument, FeedbackSchema} from "../Database/Feedback";

const SALT_ROUNDS = 10;

class SeedService {
    constructor(
        @InjectModel(User.name) private users: Model<UserDocument>,
        @InjectModel(Conversation.name) private convos: Model<ConversationDocument>,
        @InjectModel(Message.name) private messages: Model<MessageDocument>,
        @InjectModel(Notification.name) private notifs: Model<NotificationDocument>,
        @InjectModel(AuditLog.name) private audits: Model<AuditLogDocument>,
        @InjectModel(Feedback.name) private feedback: Model<FeedbackDocument>, // remove if not used
    ) {}

    private normalizeEmail(email: string) { return email.trim().toLowerCase(); }

    private async upsertUser(input: {
        email: string; name: string; role: UserRole; rawPassword: string; isEmailVerified?: boolean;
    }) {
        const existing = await this.users.findOne({ email: input.email }).select('+passwordHash');
        if (existing) return existing;
        const passwordHash = await bcrypt.hash(input.rawPassword, SALT_ROUNDS);
        return this.users.create({
            email: input.email,
            name: input.name,
            role: input.role,
            isEmailVerified: !!input.isEmailVerified,
            passwordHash,
        });
    }

    async run() {
        const [admin, instructor, student] = await Promise.all([
            this.upsertUser({ email: this.normalizeEmail('admin@example.com'),      name: 'Admin User',      role: UserRole.ADMIN,      rawPassword: 'Admin123!',      isEmailVerified: true }),
            this.upsertUser({ email: this.normalizeEmail('instructor@example.com'), name: 'Instructor One',  role: UserRole.INSTRUCTOR, rawPassword: 'Instructor123!', isEmailVerified: true }),
            this.upsertUser({ email: this.normalizeEmail('student@example.com'),    name: 'Student One',     role: UserRole.STUDENT,    rawPassword: 'Student123!',    isEmailVerified: true }),
        ]);

        // Conversation (instructor ↔ student)
        const participants = [instructor._id, student._id].sort((a,b)=>a.toString().localeCompare(b.toString()));
        let convo = await this.convos.findOne({ participants: { $all: participants, $size: 2 } });
        if (!convo) {
            convo = await this.convos.create({ participants, isGroup: false, lastMessageAt: new Date() });
        }

        // Sample messages
        const existsMsg = await this.messages.findOne({ conversation: convo._id });
        if (!existsMsg) {
            const m1 = await this.messages.create({ conversation: convo._id, sender: instructor._id, content: 'Welcome to the course! 🎉', readBy: [instructor._id] });
            const m2 = await this.messages.create({ conversation: convo._id, sender: student._id,    content: 'Thanks! Looking forward to it.', readBy: [student._id] });
            await this.convos.findByIdAndUpdate(convo._id, {
                lastMessage: m2._id,
                lastMessageAt: new Date(),
                $set: { [`lastReadBy.${student._id.toString()}`]: m2._id },
        });
        }

        // Notification to student
        const notifExists = await this.notifs.findOne({ recipientId: student._id, type: NotificationType.Announcement });
        if (!notifExists) {
            await this.notifs.create({
                recipientId: student._id,
                type: NotificationType.Announcement,
                message: 'Your account is ready. Explore your dashboard!',
                sentBy: admin._id,
                read: false,
            });
        }

        // Audit logs
        const anyAudit = await this.audits.findOne({});
        if (!anyAudit) {
            await this.audits.insertMany([
                { userId: admin._id,   event: AuditEvent.ADMIN_ANNOUNCE_ALL, timestamp: new Date(), details: { seed: true } },
                { userId: student._id, event: AuditEvent.LOGIN_FAILED,       timestamp: new Date(Date.now() - 3600_000), details: { reason: 'seed-sample' } },
            ]);
        }

        // Optional feedback
        const fb = await this.feedback.findOne({ category: 'general' }).lean();
        if (!fb) {
            await this.feedback.create({
                userId: student._id,
                message: 'Loving the platform so far!',
                contactEmail: student.email,
                category: 'general',
            });
        }

        console.log('✅ Seed complete.');
    }
}

@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spi'),
        MongooseModule.forFeature([
            { name: User.name,         schema: UserSchema },
            { name: Conversation.name, schema: ConversationSchema },
            { name: Message.name,      schema: MessageSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: AuditLog.name,     schema: AuditLogSchema },
            { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
            { name: Feedback.name,     schema: FeedbackSchema }, // remove if not used
        ]),
    ],
    providers: [SeedService],
})
class SeedModule {}

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn', 'log'] });
    try {
        const svc = app.get(SeedService);
        await svc.run();
    } finally {
        await app.close();
    }
}
bootstrap().catch((e) => { console.error(e); process.exit(1); });