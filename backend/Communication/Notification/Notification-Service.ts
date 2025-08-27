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