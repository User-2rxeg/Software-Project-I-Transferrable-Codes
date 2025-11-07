import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';


export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
    participants!: Types.ObjectId[];

    @Prop({ type: Boolean, default: false })
    isGroup: boolean = false;

    @Prop({ type: String })
    groupName?: string;

    @Prop({ type: Types.ObjectId, ref: 'Course' })
    courseId?: Types.ObjectId;

    @Prop({ type: Map, of: Types.ObjectId, default: {} })
    lastReadBy?: Map<string, Types.ObjectId>;

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessage?: Types.ObjectId;

    @Prop({ type: Date, index: true })
    lastMessageAt?: Date;

    @Prop({ type: Date })
    createdAt?: Date;

    @Prop({ type: Date })
    updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });

// export type ConversationDocument = HydratedDocument<Conversation>;
//
// @Model({ timestamps: true })
// export class Conversation {
//     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
//     participants!: Types.ObjectId[];
//
//     @Prop({ type: Boolean, default: false })
//     isGroup: boolean = false;
//
//     @Prop({ type: String })
//     groupName?: string;
//
//     @Prop({ type: Types.ObjectId, ref: 'Course' })
//     courseId?: Types.ObjectId;
//
//     // Per-user last read message for fast unread computations, keyed by userId string
//     @Prop({ type: Map, of: Types.ObjectId, default: {} })
//     lastReadBy?: Map<string, Types.ObjectId>;
//
//     @Prop({ type: Types.ObjectId, ref: 'Message' })
//     lastMessage?: Types.ObjectId;
//
//     @Prop({ type: Date, index: true })
//     lastMessageAt?: Date;
//
//     @Prop({type: Date, index: true})
//     createdAt: Date = new Date();
// }
//
// export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// ConversationSchema.index({ participants: 1, lastMessageAt: -1 });


//import { Prop, Model, SchemaFactory } from '@nestjs/mongoose';
//import { HydratedDocument, Types } from 'mongoose';

//export type ConversationDocument = HydratedDocument<Conversation>;

//@Model({ timestamps: true })
//export class Conversation {
    //@Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
   // participants!: Types.ObjectId[];

    //@Prop({ default: false })
    //isGroup?: boolean;

    //@Prop({ type: Types.ObjectId, ref: 'Message', default: null })
    //lastMessage?: Types.ObjectId | null;

    //@Prop({ type: Date, default: null, index: true })
    //lastMessageAt?: Date | null;

    //@Prop({ type: String, default: null }) // group name if isGroup
  //  name?: string | null;
//}
//export const ConversationSchema = SchemaFactory.createForClass(Conversation);
//ConversationSchema.index({ participants: 1, lastMessageAt: -1 });


// // Conversation (was Chat)
// @Model({ timestamps: true })
// export class Conversation {
//     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
//     participants!: Types.ObjectId[];
//
//     @Prop({ type: Boolean, default: false })
//     isGroup: boolean = false;
//
//     @Prop({ type: String })
//     groupName?: string;
//
//     @Prop({ type: Types.ObjectId, ref: 'Course' })
//     courseId?: Types.ObjectId;
//
//     // fast unread: per-user lastReadMessage
//     @Prop({ type: Map, of: Types.ObjectId, default: {} })
//     lastReadBy?: Map<string, Types.ObjectId>;
//
//     @Prop({ type: Types.ObjectId, ref: 'Message' })
//     lastMessage?: Types.ObjectId;
//
//     @Prop({ type: Date, index: true })
//     lastMessageAt?: Date;
// }
// ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
//
// export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// export type ConversationDocument = HydratedDocument<Conversation>;


// export type ConversationDocument = HydratedDocument<Conversation>;
//
// @Model({ timestamps: true })
// export class Conversation {
//     @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true, index: true })
//     participants!: Types.ObjectId[];
//
//     @Prop({ type: Boolean, default: false })
//     isGroup: boolean = false;
//
//     @Prop({ type: String })
//     groupName?: string;
//
//     @Prop({ type: Types.ObjectId, ref: 'Course' })
//     courseId?: Types.ObjectId;
//
//     // Per-user last read message for fast unread computations, keyed by userId string
//     @Prop({ type: Map, of: Types.ObjectId, default: {} })
//     lastReadBy?: Map<string, Types.ObjectId>;
//
//     @Prop({ type: Types.ObjectId, ref: 'Message' })
//     lastMessage?: Types.ObjectId;
//
//     @Prop({ type: Date, index: true })
//     lastMessageAt?: Date;
// }
