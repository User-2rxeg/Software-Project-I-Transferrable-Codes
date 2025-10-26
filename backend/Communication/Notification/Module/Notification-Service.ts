import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {Notification, NotificationDocument, NotificationSchema, NotificationType} from '../Models/Notification';
import { NotificationAuditLog, NotificationAuditLogDocument } from '../Models/Notification-Log';
import { User, UserDocument, UserRole } from '../../../User/Model/User';
import { NotificationGateway } from '../Gateway/Notification-Gateway';

import { MailService } from '../../../Authentication/Email/Email-Service';
import {CreateNotificationDto} from "../Validators/Create-Notification";

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name)                  // now the symbol is defined
        private readonly notificationModel: Model<NotificationDocument>,
        @InjectModel(NotificationAuditLog.name)
        private readonly auditModel: Model<NotificationAuditLogDocument>,
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
        private readonly gateway: NotificationGateway,
        private readonly mail: MailService,
    ) {}

    async createNotification(dto: CreateNotificationDto, senderId: string) {

        const sender = await this.userModel.findById(senderId).lean();
        if (!sender) throw new NotFoundException('Sender not found');

        if (dto.type === NotificationType.Announcement) {
            if (!(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)) {
                throw new ForbiddenException('Not allowed to send announcements');
            }
            // If instructor sending announcement, optionally check they teach the given course (if courseId provided)
            if (sender.role === UserRole.INSTRUCTOR && dto.courseId) {
                // TODO: replace with real check against Course model
                // Example: verify this instructor teaches dto.courseId
                // const teaches = await this.courseModel.exists({ _id: dto.courseId, instructors: sender._id });
                // if (!teaches) throw new ForbiddenException('Instructor not allowed to announce for this course');
            }
        }

        if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
            throw new ForbiddenException('Students cannot send notifications to others');
        }

        const doc = await this.notificationModel.create({
            recipientId: new Types.ObjectId(dto.recipientId),
            type: dto.type,
            message: dto.message,
            courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
            sentBy: new Types.ObjectId(senderId),
        });

        await this.auditModel.create({
            notificationId: doc._id,
            eventType: 'SENT',
            userId: new Types.ObjectId(senderId),
        });

        await this.userModel.updateOne(
            { _id: doc.recipientId },
            { $inc: { unreadNotificationCount: 1 } }
        ).exec();

        (async () => {
            try {
                const recipient = await this.userModel.findById(doc.recipientId).lean();
                if (recipient?.email) {
                    const subject = dto.type === NotificationType.Announcement ? '[Announcement]' : 'New notification';

                    await this.mail.sendNotificationEmail(recipient.email, subject, dto.message);
                }
            } catch (e) {

                await this.auditModel.create({
                    notificationId: doc._id,
                    eventType: 'SENT',
                    userId: new Types.ObjectId(senderId),

                });
            }
        })();

        this.gateway.emitToUser(String(doc.recipientId), 'notification:new', {
            id: String(doc._id),
            type: doc.type,
            message: doc.message,
            createdAt: (doc as any).createdAt ?? new Date(),
            read: doc.read,
            courseId: doc.courseId ? String(doc.courseId) : undefined,
            sentBy: String(doc.sentBy),
        });

        return doc;
    }



    async sendToMany(userIds: string[], input: { type: NotificationType; message: string; courseId?: string }, senderId: string) {
        const sender = await this.userModel.findById(senderId).lean();
        if (!sender) throw new NotFoundException('Sender not found');

        if (input.type === NotificationType.Announcement) {
            if (!(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)) {
                throw new ForbiddenException('Not allowed to send announcements');
            }
            // instructor course membership checks here if required
        }


        const docsToInsert = userIds.map((u) => ({
            recipientId: new Types.ObjectId(u),
            type: input.type,
            message: input.message,
            courseId: input.courseId ? new Types.ObjectId(input.courseId) : undefined,
            sentBy: new Types.ObjectId(senderId),
        }));

        const inserted = await this.notificationModel.insertMany(docsToInsert);

        await this.auditModel.insertMany(
            inserted.map((n) => ({
                notificationId: n._id,
                eventType: 'SENT' as const,
                userId: new Types.ObjectId(senderId),
            }))
        );

        const bulkOps = userIds.map((uid) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(uid) },
                update: { $inc: { unreadNotificationCount: 1 } },
            },
        }));
        if (bulkOps.length) await this.userModel.bulkWrite(bulkOps);

        for (const n of inserted) {
            this.gateway.emitToUser(String(n.recipientId), 'notification:new', {
                id: String(n._id),
                type: n.type,
                message: n.message,
                createdAt: (n as any).createdAt ?? new Date(),
                read: n.read,
                courseId: n.courseId ? String(n.courseId) : undefined,
                sentBy: String(n.sentBy),
            });
        }

        return { count: inserted.length };
    }

    // Mark single notification as read
    async markAsRead(notificationId: string, userId: string) {
        const n = await this.notificationModel.findById(notificationId);
        if (!n) throw new NotFoundException('Notification not found');
        if (String(n.recipientId) !== userId) {
            throw new ForbiddenException('Not allowed');
        }

        if (!n.read) {
            n.read = true;
            await n.save();

            await this.userModel.updateOne(
                { _id: new Types.ObjectId(userId), unreadNotificationCount: { $gt: 0 } },
                { $inc: { unreadNotificationCount: -1 } }
            ).exec();

            await this.auditModel.create({
                notificationId: n._id,
                eventType: 'READ',
                userId: new Types.ObjectId(userId),
            });

            this.gateway.emitToUser(userId, 'notification:read', { id: String(n._id) });
        }

        return n;
    }

    // Mark many notifications as read (bulk)
    async markManyAsRead(userId: string, ids: string[]) {
        const _ids = ids.map((id) => new Types.ObjectId(id));
        const res = await this.notificationModel.updateMany(
            { _id: { $in: _ids }, recipientId: new Types.ObjectId(userId), read: false },
            { $set: { read: true } }
        );

        if (res.modifiedCount) {
            // decrement unread count by modifiedCount (but avoid negative)
            await this.userModel.updateOne(
                { _id: new Types.ObjectId(userId) },
                { $inc: { unreadNotificationCount: -res.modifiedCount } }
            );

            await this.auditModel.insertMany(
                _ids.map((_id) => ({
                    notificationId: _id,
                    eventType: 'READ' as const,
                    userId: new Types.ObjectId(userId),
                }))
            );

            this.gateway.emitToUser(userId, 'notification:readMany', { ids });
        }

        return { ok: true, count: res.modifiedCount };
    }

    // Mark all as read
    async markAllAsRead(userId: string) {
        const uid = new Types.ObjectId(userId);
        const res = await this.notificationModel.updateMany({ recipientId: uid, read: false }, { $set: { read: true } });
        if (res.modifiedCount) {
            // reset counter to 0
            await this.userModel.updateOne({ _id: uid }, { $set: { unreadNotificationCount: 0 } });
            // insert audit logs for each updated (optional — could be heavy)
            const updated = await this.notificationModel.find({ recipientId: uid }).select('_id').lean().exec();
            await this.auditModel.insertMany(updated.map((n) => ({ notificationId: n._id, eventType: 'READ', userId: uid })));
            this.gateway.emitToUser(userId, 'notification:readAll', { ids: updated.map((n) => String(n._id)) });
        }
        return { ok: true, count: res.modifiedCount };
    }

    // List user notifications
    async getUserNotifications(userId: string) {
        return this.notificationModel
            .find({ recipientId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async countUnread(userId: string) {
        return this.notificationModel.countDocuments({ recipientId: new Types.ObjectId(userId), read: false }).exec();
    }

//Cursor-based listing (optional unreadOnly)
//     async list(
//         userId: string,
//         limit = 20,
//         cursor?: string,
//         unreadOnly = false,
//     ) {
//         const filter: any = { recipientId: new Types.ObjectId(userId) };
//         if (unreadOnly) filter.read = false;
//
//         const q = this.notificationModel.find(filter).sort({ _id: -1 }).limit(limit);
//         if (cursor) q.where('_id').lt(new Types.ObjectId(cursor));
//
//         const items = await q.lean().exec();
//         const nextCursor = items.length === limit ? String(items[items.length - 1]._id) : null;
//         return { items, nextCursor };
//     }

    // async markManyAsRead(userId: string, ids: string[]) {
    //     const _ids = ids.map((id) => new Types.ObjectId(id));
    //     const res = await this.notificationModel.updateMany(
    //         { _id: { $in: _ids }, recipientId: new Types.ObjectId(userId), read: false },
    //         { $set: { read: true } },
    //     );
    //     if (res.modifiedCount) {
    //         await this.auditModel.insertMany(
    //             _ids.map((_id) => ({
    //                 notificationId: _id,
    //                 eventType: 'READ' as const,
    //                 userId: new Types.ObjectId(userId),
    //             })),
    //         );
    //         this.gateway.emitToUser(userId, 'notification:readMany', { ids });
    //     }
    //     return { ok: true, count: res.modifiedCount };
    // }
    //
    // async sendToMany(
    //     userIds: string[],
    //     input: { type: NotificationType; message: string; courseId?: string },
    //     senderId: string,
    // ) {
    //     const sender = await this.userModel.findById(senderId).lean();
    //     if (!sender) throw new NotFoundException('Sender not found');
    //
    //     if (
    //         input.type === NotificationType.Announcement &&
    //         !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)
    //     ) {
    //         throw new ForbiddenException('Not allowed to send announcements');
    //     }
    //
    //     const doc = await this.notificationModel.create({
    //         recipientId: null, // placeholder when used as a template; or skip this field entirely in a separate "NotificationTemplate"
    //         type: input.type,
    //         message: input.message,
    //         courseId: input.courseId ? new Types.ObjectId(input.courseId) : undefined,
    //         sentBy: new Types.ObjectId(senderId),
    //     });
    //
    //     const ids = userIds.map((u) => new Types.ObjectId(u));
    //     // For in-app delivery, you can either:
    //     //  A) create one row per user (heavier writes, simpler reads), or
    //     //  B) keep a template + per-user "delivery logs". Below is A) for simplicity:
    //     const docs = ids.map((rid) => ({
    //         recipientId: rid,
    //         type: doc.type,
    //         message: doc.message,
    //         courseId: doc.courseId,
    //         sentBy: doc.sentBy,
    //     }));
    //     const inserted = await this.notificationModel.insertMany(docs);
    //
    //     await this.auditModel.insertMany(
    //         inserted.map((n) => ({
    //             notificationId: n._id,
    //             eventType: 'SENT' as const,
    //             userId: new Types.ObjectId(senderId),
    //         })),
    //     );
    //
    //     // emit per user
    //     for (const n of inserted) {
    //         this.gateway.emitToUser(String(n.recipientId), 'notification:new', {
    //             id: String(n._id),
    //             type: n.type,
    //             message: n.message,
    //             createdAt: (n as any).createdAt,
    //             read: n.read,
    //             courseId: n.courseId ? String(n.courseId) : undefined,
    //             sentBy: String(n.sentBy),
    //         });
    //     }
    //     return { count: inserted.length };
    // }

}




// async createNotification(dto: CreateNotificationDto, senderId: string) {
//     const sender = await this.userModel.findById(senderId).lean();
//     if (!sender) throw new NotFoundException('Sender not found');
//
//     // Policy: Announcements only by admin/Instructor; Students cannot target others
//     if (
//         dto.type === NotificationType.Announcement &&
//         !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)
//     ) {
//         throw new ForbiddenException('Not allowed to send announcements');
//     }
//     if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
//         throw new ForbiddenException('Students cannot send notifications to others');
//     }
//
//     const doc = await this.notificationModel.create({
//         recipientId: new Types.ObjectId(dto.recipientId),
//         type: dto.type,
//         message: dto.message,
//         courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
//         sentBy: new Types.ObjectId(senderId),
//     });
//
//     await this.auditModel.create({
//         notificationId: doc._id,
//         eventType: 'SENT',
//         userId: new Types.ObjectId(senderId),
//     });
//
//     // Realtime update
//     this.gateway.emitToUser(String(doc.recipientId), 'notification:new', {
//         id: String(doc._id),
//         type: doc.type,
//         message: doc.message,
//         createdAt: (doc as any).createdAt,
//         read: doc.read,
//         courseId: doc.courseId ? String(doc.courseId) : undefined,
//         sentBy: String(doc.sentBy),
//     });
//
//     return doc;
// }





// async createNotification(dto: CreateNotificationDto, senderId: string) {
//     const sender = await this.userModel.findById(senderId).lean();
//     if (!sender) throw new NotFoundException('Sender not found');
//
//     // Policy: Announcements only by admin/Instructor; Students cannot target others
//     if (
//         dto.type === NotificationType.Announcement &&
//         !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)
//     ) {
//         throw new ForbiddenException('Not allowed to send announcements');
//     }
//     if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
//         throw new ForbiddenException('Students cannot send notifications to others');
//     }
//
//     const doc = await this.notificationModel.create({
//         recipientId: new Types.ObjectId(dto.recipientId),
//         type: dto.type,
//         message: dto.message,
//         courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
//         sentBy: new Types.ObjectId(senderId),
//     });
//
//     await this.auditModel.create({
//         notificationId: doc._id,
//         eventType: 'SENT',
//         userId: new Types.ObjectId(senderId),
//     });
//
//     // Realtime update
//     this.gateway.emitToUser(String(doc.recipientId), 'notification:new', {
//         id: String(doc._id),
//         type: doc.type,
//         message: doc.message,
//         createdAt: (doc as any).createdAt,
//         read: doc.read,
//         courseId: doc.courseId ? String(doc.courseId) : undefined,
//         sentBy: String(doc.sentBy),
//     });
//
//     return doc;
// }







// import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Notification, NotificationDocument } from '../../Model/Notification';
// import {NotificationAuditLog, NotificationAuditLogDocument} from "../../Model/Notification-Log";
// import {User, UserDocument, UserRole} from "../../Model/User";
// import {NotificationGateway} from "../Gateway/Notification-Gateway";
// import {CreateNotificationDto} from "../../Validators/Notification-Validator";
//
//
// @Injectable()
// export class NotificationService {
//     constructor(
//         @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
//         @InjectModel(NotificationAuditLog.name) private readonly auditModel: Model<NotificationAuditLogDocument>,
//         //@InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
//         @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//         private readonly gateway: NotificationGateway,
//     ) {}
//
//     // async createNotification(dto: CreateNotificationDto, senderId: string) {
//     //     const sender = await this.userModel.findById(senderId);
//     //     if (!sender) throw new NotFoundException('Sender not found');
//     //
//     //     if (dto.courseId) {
//     //         const exists = await this.courseModel.exists({ _id: dto.courseId });
//     //         if (!exists) throw new NotFoundException('Course not found');
//     //     }
//     //
//     //     if (dto.type === 'announcement' && !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)) {
//     //         throw new ForbiddenException('You are not allowed to send announcements');
//     //     }
//     //     if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
//     //         throw new ForbiddenException('Students cannot send notifications to others');
//     //     }
//     //
//     //     const notification = await this.notificationModel.create({
//     //         recipientId: new Types.ObjectId(dto.recipientId),
//     //         type: dto.type,
//     //         message: dto.message,
//     //         courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
//     //         sentBy: sender._id,
//     //     });
//     //
//     //     await this.auditModel.create({
//     //         notificationId: notification._id,
//     //         eventType: 'SENT',
//     //         userId: sender._id, // actor
//     //     });
//     //
//     //     this.gateway.emitToUser(String(notification.recipientId), 'notification:new', {
//     //         id: String(notification._id),
//     //         type: notification.type,
//     //         message: notification.message,
//     //         createdAt: (notification as any).createdAt,
//     //         read: notification.read,
//     //         courseId: notification.courseId ? String(notification.courseId) : undefined,
//     //         sentBy: String(notification.sentBy),
//     //     });
//     //
//     //     return notification;
//     // }
//
//     async markAsRead(notificationId: string, userId: string) {
//         const notification = await this.notificationModel.findById(notificationId);
//         if (!notification) throw new NotFoundException('Notification not found');
//         if (String(notification.recipientId) !== userId) {
//             throw new ForbiddenException('You are not allowed to mark this notification');
//         }
//         if (!notification.read) {
//             notification.read = true;
//             await notification.save();
//             await this.auditModel.create({
//                 notificationId: notification._id,
//                 eventType: 'READ',
//                 userId: new Types.ObjectId(userId), // actor
//             });
//             this.gateway.emitToUser(userId, 'notification:read', { id: String(notification._id) });
//         }
//         return notification;
//     }
//
//     async deleteNotification(notificationId: string, userId: string) {
//         const notification = await this.notificationModel.findById(notificationId);
//         if (!notification) throw new NotFoundException('Notification not found');
//
//         const actor = await this.userModel.findById(userId);
//         if (String(notification.recipientId) !== userId) {
//             if (!actor || actor.role !== UserRole.ADMIN) {
//                 throw new ForbiddenException('You are not allowed to delete this notification');
//             }
//         }
//
//         await this.notificationModel.findByIdAndDelete(notificationId);
//         await this.auditModel.create({
//             notificationId: notification._id,
//             eventType: 'DELETED',
//             userId: new Types.ObjectId(userId), // actor (fix)
//         });
//
//         this.gateway.emitToUser(String(notification.recipientId), 'notification:deleted', { id: String(notification._id) });
//         return { ok: true };
//     }
//
//     async markAllAsRead(userId: string) {
//         await this.notificationModel.updateMany(
//             { recipientId: new Types.ObjectId(userId), read: false },
//             { $set: { read: true } },
//         );
//
//         const updated = await this.notificationModel
//             .find({ recipientId: new Types.ObjectId(userId), read: true })
//             .select('_id')
//             .exec();
//
//         if (updated.length) {
//             await this.auditModel.insertMany(
//                 updated.map((n) => ({
//                     notificationId: n._id,
//                     eventType: 'READ',
//                     userId: new Types.ObjectId(userId),
//                 })),
//             );
//             this.gateway.emitToUser(userId, 'notification:readAll', { ids: updated.map((n) => String(n._id)) });
//         }
//
//         return { ok: true };
//     }
//
//     async getUserNotifications(userId: string) {
//         return this.notificationModel
//             .find({ recipientId: new Types.ObjectId(userId) })
//             .sort({ createdAt: -1 })
//             .exec();
//     }
// }
//

// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Notification } from '../Model/notifications/notification.schema';
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