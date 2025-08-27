import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    conversation!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    sender!: Types.ObjectId;

    @Prop({ type: String })
    content?: string;

    @Prop({ type: String })
    attachmentUrl?: string;

    // Optional: readers list (OK for small groups); for scale rely on Conversation.lastReadBy
    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    readBy?: Types.ObjectId[];

    @Prop({type:Date, default: null})
    createdAt: Date=new Date();

}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, _id: -1 }); // enables cursor pagination by _id