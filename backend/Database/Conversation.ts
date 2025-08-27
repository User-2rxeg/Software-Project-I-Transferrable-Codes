import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
    participants!: Types.ObjectId[];

    @Prop({ type: Boolean, default: false })
    isGroup: boolean = false;

    @Prop({ type: String })
    groupName?: string;

    @Prop({ type: Types.ObjectId, ref: 'Course' })
    courseId?: Types.ObjectId;

    // Per-user last read message for fast unread computations, keyed by userId string
    @Prop({ type: Map, of: Types.ObjectId, default: {} })
    lastReadBy?: Map<string, Types.ObjectId>;

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessage?: Types.ObjectId;

    @Prop({ type: Date, index: true })
    lastMessageAt?: Date;

    @Prop({type: Date, index: true})
    createdAt: Date = new Date();
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });