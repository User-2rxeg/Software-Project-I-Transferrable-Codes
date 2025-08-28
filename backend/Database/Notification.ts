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


//export type NotificationDocument = HydratedDocument<Notification>;

//export type NotificationType = 'system' | 'message' | 'course' | 'alert';

//@Schema({ timestamps: true })
//export class Notification {
    //@Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    //user!: Types.ObjectId;

    //@Prop({ type: String, required: true })
    //type!: NotificationType;

    //@Prop({ type: String, required: true })
    //title!: string;

    //@Prop({ type: String, default: '' })
    //body?: string;

    //@Prop({ type: String, default: null }) // deep-link path
    //link?: string | null;

    //@Prop({ type: Object, default: {} })
    //data?: Record<string, any>;

    //@Prop({ type: Date, default: null, index: true })
  //  readAt?: Date | null;
//}
//export const NotificationSchema = SchemaFactory.createForClass(Notification);
//NotificationSchema.index({ user: 1, createdAt: -1 });
//NotificationSchema.index({ user: 1, readAt: 1 });


// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, Types } from 'mongoose';
//
// export type NotificationDocument = HydratedDocument<Notification>;
// export type NotificationType = 'announcement' | 'message' | 'system' | 'course';
//
// @Schema({ timestamps: true }) // provides createdAt, updatedAt
// export class Notification {
//     @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
//     recipientId!: Types.ObjectId;
//
//     @Prop({ type: String, required: true, enum: ['announcement','message','system','course'] })
//     type!: NotificationType;
//
//     @Prop({ type: String, required: true })
//     message!: string;
//
//     @Prop({ type: Boolean, default: false, index: true })
//     read: boolean = false;
//
//     @Prop({ type: Types.ObjectId, ref: 'Course' })
//     courseId?: Types.ObjectId;
//
//     @Prop({ type: Types.ObjectId, ref: 'User' })
//     sentBy?: Types.ObjectId;
// }
// export const NotificationSchema = SchemaFactory.createForClass(Notification);
// // helpful indexes
// NotificationSchema.index({ recipientId: 1, createdAt: -1 });
// NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
