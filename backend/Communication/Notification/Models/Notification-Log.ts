

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationAuditLogDocument = HydratedDocument<NotificationAuditLog>;
export type NotificationEventType = 'SENT' | 'READ' | 'DELETED';// USE ENUM MAYBE???

export enum NotificationStatus {
    SENT='SENT',
    READ='DELETED',
    DELETED='DELETED'
}

@Schema({ timestamps: true })
export class NotificationAuditLog {
    @Prop({ type: Types.ObjectId, ref: 'Notification', required: true, index: true })
    notificationId!: Types.ObjectId;

    @Prop({ type: String, enum: ['SENT', 'READ', 'DELETED'], required: true, index: true })
    eventType!: NotificationEventType;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId!: Types.ObjectId;
}

export const NotificationAuditLogSchema = SchemaFactory.createForClass(NotificationAuditLog);


NotificationAuditLogSchema.index({ notificationId: 1, createdAt: -1 });
NotificationAuditLogSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
NotificationAuditLogSchema.index({ createdAt: -1 });


