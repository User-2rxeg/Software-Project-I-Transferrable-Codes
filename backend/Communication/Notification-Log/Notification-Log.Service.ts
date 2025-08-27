import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {NotificationAuditLogDocument} from "../../Database/Notification-Log";



@Injectable()
export class NotificationAuditService {
    constructor(
        @InjectModel('NotificationAuditLog')
        private readonly auditModel: Model<NotificationAuditLogDocument>,
    ) {}

    async list(params: {
        page?: number;
        limit?: number;
        notificationId?: string;
        userId?: string;
        eventType?: 'SENT'|'READ'|'DELETED';
        from?: string;
        to?: string;
    }) {
        const page  = Math.max(1, Number(params.page)  || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip  = (page - 1) * limit;

        const q: FilterQuery<NotificationAuditLogDocument> = {};
        if (params.notificationId) q.notificationId = params.notificationId;
        if (params.userId)        q.userId = params.userId;
        if (params.eventType)     q.eventType = params.eventType;
        if (params.from || params.to) {
            q.timestamp = {};
            if (params.from) q.timestamp.$gte = new Date(params.from);
            if (params.to)   q.timestamp.$lte = new Date(params.to);
        }

        const [items, total] = await Promise.all([
            this.auditModel.find(q).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
            this.auditModel.countDocuments(q).exec(),
        ]);

        return { items, total, page, pages: Math.ceil(total / limit), limit };
    }

    async byNotification(notificationId: string, page = 1, limit = 20) {
        return this.list({ notificationId, page, limit });
    }
}