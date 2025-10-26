
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Types} from "mongoose";



export enum NotificationType {
    Announcement = 'Announcement',
    NewMessage = 'New Message',
    SystemAlert = 'System Alert',
    Other = 'Other',
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    recipientId!: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(NotificationType), required: true })
    type!: NotificationType;

    @Prop({ type: String, required: true })
    message!: string;

    @Prop({ type: Boolean, default: false, index: true })
    read!: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Course', required: false })
    courseId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: false })
    sentBy?: Types.ObjectId;

    createdAt!: Date;
    updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Helpful query patterns
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });



