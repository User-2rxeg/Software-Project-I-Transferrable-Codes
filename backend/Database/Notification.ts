import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;
export type NotificationType = 'courseUpdate' | 'assignmentDue' | 'newMessage' | 'systemAlert' | 'other';
@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    recipientId!: Types.ObjectId;

    @Prop({ type: String, required: true })
    type!: string;

    @Prop({ type: String, required: true })
    message!: string;

    @Prop({ type: Boolean, default: false })
    read: boolean = false;


    @Prop({ type: Types.ObjectId, ref: 'Course', required: false })
    courseId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    sentBy?: Types.ObjectId;  // The admin/instructor who sent this notification


}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Helpful indexes:
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, read: 1, createdAt:-1});