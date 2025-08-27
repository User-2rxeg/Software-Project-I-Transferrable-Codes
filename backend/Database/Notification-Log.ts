import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationAuditLogDocument = HydratedDocument<NotificationAuditLog>;
export type NotificationEventType = 'SENT' | 'READ' | 'DELETED';
@Schema({ timestamps: true })
export class NotificationAuditLog {
    @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
    notificationId!: Types.ObjectId;

    @Prop({ type: String, enum: ['SENT', 'READ', 'DELETED'], required: true })
    eventType!: NotificationEventType;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId!: Types.ObjectId;


}

export const NotificationAuditLogSchema = SchemaFactory.createForClass(NotificationAuditLog);

NotificationAuditLogSchema.index({ notificationId: 1, eventType: 1, timestamp: -1 });
NotificationAuditLogSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
NotificationAuditLogSchema.index({ timestamp:-1});