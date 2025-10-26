import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    conversation!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    sender!: Types.ObjectId;

    @Prop({ type: String })
    content?: string;

    @Prop({ type: String })
    attachmentUrl?: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    readBy?: Types.ObjectId[];

    @Prop({ type: Date })
    createdAt?: Date;

    @Prop({ type: Date })
    updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for common queries
MessageSchema.index({ conversation: 1, _id: -1 });         // cursor by _id
MessageSchema.index({ conversation: 1, createdAt: -1 });   // time sort
MessageSchema.index({ conversation: 1, sender: 1, _id: -1 });

// export type MessageDocument = HydratedDocument<Message>;
//
// @Model({ timestamps: true })
// export class Message {
//     @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
//     conversation!: Types.ObjectId;
//
//     @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
//     sender!: Types.ObjectId;
//
//     @Prop({ type: String })
//     content?: string;
//
//     @Prop({ type: String })
//     attachmentUrl?: string;
//
//     // Optional: readers list (OK for small groups); for scale rely on Conversation.lastReadBy
//     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
//     readBy?: Types.ObjectId[];
//
//     @Prop({type:Date, default: null})
//     createdAt: Date=new Date();
//
// }
//
// export const MessageSchema = SchemaFactory.createForClass(Message);
// MessageSchema.index({ conversation: 1, _id: -1 }); // enables cursor pagination by _id


//export type MessageDocument = HydratedDocument<Message>;

//export type MessageStatus = 'sent' | 'delivered' | 'read';

//@Model({ timestamps: true })
//export class Message {
    //@Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    //conversation!: Types.ObjectId;

    //@Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    //sender!: Types.ObjectId;

    //@Prop({ type: String, default: '' })
   // content?: string;

    //@Prop({ type: String, default: null }) // e.g., file URL
    //attachmentUrl?: string | null;

    //@Prop({ type: String, default: 'sent' })
    //status?: MessageStatus;

    //@Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  //  readBy?: Types.ObjectId[];
//}
//export const MessageSchema = SchemaFactory.createForClass(Message);
//MessageSchema.index({ conversation: 1, createdAt: -1 });// // Message
// // @Model({ timestamps: true })
// // export class Message {
// //     @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
// //     conversation!: Types.ObjectId;
// //
// //     @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
// //     sender!: Types.ObjectId;
// //
// //     @Prop({ type: String })
// //     content?: string;
// //
// //     @Prop({ type: String })
// //     attachmentUrl?: string;
// //
// //     // per-user reads: store readers (OK for small rooms) or rely on lastReadBy per convo.
// //     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
// //     readBy?: Types.ObjectId[];
// // }
// // MessageSchema.index({ conversation: 1, _id: -1 }); // cursor by _id


// @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
// participants!: Types.ObjectId[];
//
// @Prop({
//     type: [{
//         sender: { type: Types.ObjectId, ref: 'User', required: true },
//         content: { type: String, required: true },
//         timestamp: { type: Date, default: Date.now },
//         readBy:   { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] }, // per-user
//     }],
//     default: [],
// })
// messages!: any[];
//
// ChatSchema.index({ updatedAt: -1 }); // for list


// export type MessageDocument = HydratedDocument<Message>;
//
// @Model({ timestamps: true })
// export class Message {
//     @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
//     conversation!: Types.ObjectId;
//
//     @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
//     sender!: Types.ObjectId;
//
//     @Prop({ type: String })
//     content?: string;
//
//     @Prop({ type: String })
//     attachmentUrl?: string;
//
//     // Optional: readers list (OK for small groups); for scale rely on Conversation.lastReadBy
//     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
//     readBy?: Types.ObjectId[];
// }
//
// export const MessageSchema = SchemaFactory.createForClass(Message);
// MessageSchema.index({ conversation: 1, _id: -1 }); // enables cursor pagination by _id