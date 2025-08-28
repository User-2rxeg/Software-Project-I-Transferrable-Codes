import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../Database/Notification';
import {NotificationAuditLog, NotificationAuditLogDocument} from "../../Database/Notification-Log";
import {User, UserDocument, UserRole} from "../../Database/User";
import {NotificationGateway} from "../Gateways/Notification-Gateway";
import {CreateNotificationDto} from "../../Validators/Notification-Validator";


@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
        @InjectModel(NotificationAuditLog.name) private readonly auditModel: Model<NotificationAuditLogDocument>,
        //@InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly gateway: NotificationGateway,
    ) {}

    async createNotification(dto: CreateNotificationDto, senderId: string) {
        const sender = await this.userModel.findById(senderId);
        if (!sender) throw new NotFoundException('Sender not found');

        if (dto.courseId) {
            const exists = await this.courseModel.exists({ _id: dto.courseId });
            if (!exists) throw new NotFoundException('Course not found');
        }

        if (dto.type === 'announcement' && !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)) {
            throw new ForbiddenException('You are not allowed to send announcements');
        }
        if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
            throw new ForbiddenException('Students cannot send notifications to others');
        }

        const notification = await this.notificationModel.create({
            recipientId: new Types.ObjectId(dto.recipientId),
            type: dto.type,
            message: dto.message,
            courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
            sentBy: sender._id,
        });

        await this.auditModel.create({
            notificationId: notification._id,
            eventType: 'SENT',
            userId: sender._id, // actor
        });

        this.gateway.emitToUser(String(notification.recipientId), 'notification:new', {
            id: String(notification._id),
            type: notification.type,
            message: notification.message,
            createdAt: (notification as any).createdAt,
            read: notification.read,
            courseId: notification.courseId ? String(notification.courseId) : undefined,
            sentBy: String(notification.sentBy),
        });

        return notification;
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.notificationModel.findById(notificationId);
        if (!notification) throw new NotFoundException('Notification not found');
        if (String(notification.recipientId) !== userId) {
            throw new ForbiddenException('You are not allowed to mark this notification');
        }
        if (!notification.read) {
            notification.read = true;
            await notification.save();
            await this.auditModel.create({
                notificationId: notification._id,
                eventType: 'READ',
                userId: new Types.ObjectId(userId), // actor
            });
            this.gateway.emitToUser(userId, 'notification:read', { id: String(notification._id) });
        }
        return notification;
    }

    async deleteNotification(notificationId: string, userId: string) {
        const notification = await this.notificationModel.findById(notificationId);
        if (!notification) throw new NotFoundException('Notification not found');

        const actor = await this.userModel.findById(userId);
        if (String(notification.recipientId) !== userId) {
            if (!actor || actor.role !== UserRole.ADMIN) {
                throw new ForbiddenException('You are not allowed to delete this notification');
            }
        }

        await this.notificationModel.findByIdAndDelete(notificationId);
        await this.auditModel.create({
            notificationId: notification._id,
            eventType: 'DELETED',
            userId: new Types.ObjectId(userId), // actor (fix)
        });

        this.gateway.emitToUser(String(notification.recipientId), 'notification:deleted', { id: String(notification._id) });
        return { ok: true };
    }

    async markAllAsRead(userId: string) {
        await this.notificationModel.updateMany(
            { recipientId: new Types.ObjectId(userId), read: false },
            { $set: { read: true } },
        );

        const updated = await this.notificationModel
            .find({ recipientId: new Types.ObjectId(userId), read: true })
            .select('_id')
            .exec();

        if (updated.length) {
            await this.auditModel.insertMany(
                updated.map((n) => ({
                    notificationId: n._id,
                    eventType: 'READ',
                    userId: new Types.ObjectId(userId),
                })),
            );
            this.gateway.emitToUser(userId, 'notification:readAll', { ids: updated.map((n) => String(n._id)) });
        }

        return { ok: true };
    }

    async getUserNotifications(userId: string) {
        return this.notificationModel
            .find({ recipientId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }
}


// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Notification } from '../Database/notifications/notification.schema';
// import { Model, Types } from 'mongoose';
//
// @Injectable()
// export class NotificationsService {
//     constructor(@InjectModel(Notification.name) private notifModel: Model<Notification>) {}
//
//     async createFor(userId: string, payload: { type: string; title: string; body?: string; link?: string; data?: any }) {
//         const doc = await this.notifModel.create({
//             user: new Types.ObjectId(userId),
//             type: payload.type,
//             title: payload.title,
//             body: payload.body ?? '',
//             link: payload.link ?? null,
//             data: payload.data ?? {},
//         });
//         return doc;
//     }
//
//     async list(userId: string, limit = 20, cursor?: string, unreadOnly?: boolean) {
//         const filter: any = { user: new Types.ObjectId(userId) };
//         if (unreadOnly) filter.readAt = null;
//         const q = this.notifModel.find(filter).sort({ _id: -1 }).limit(limit);
//         if (cursor) q.where('_id').lt(cursor);
//         return q.lean();
//     }
//
//     async markRead(userId: string, notifIds: string[]) {
//         const ids = notifIds.map(id => new Types.ObjectId(id));
//         await this.notifModel.updateMany({ _id: { $in: ids }, user: userId, readAt: null }, { $set: { readAt: new Date() } });
//         const unread = await this.notifModel.countDocuments({ user: userId, readAt: null });
//         return { unread };
//     }
//
//     async countUnread(userId: string) {
//         const unread = await this.notifModel.countDocuments({ user: userId, readAt: null });
//         return { unread };
//     }
// }
//
//
//
// NotificationService: audit “actor” bug + casting & bulk read
//
// In deleteNotification, you log userId as the recipient; should be the actor (the caller).
//
// When querying by recipientId, cast to ObjectId.

// // deleteNotification: use actor, not recipient
// await this.auditModel.create({
//     notificationId: notification._id,
//     eventType: 'DELETED',
//     userId: new Types.ObjectId(userId), // <-- actor, not notification.recipientId
// });
//
// // getUserNotifications: cast
// return this.notificationModel
//     .find({ recipientId: new Types.ObjectId(userId) })
//     .sort({ createdAt: -1 })
//     .exec();
//
// // markAllAsRead: cast & filter correctly
// await this.notificationModel.updateMany(
//     { recipientId: new Types.ObjectId(userId), read: false },
//     { $set: { read: true } },
// );