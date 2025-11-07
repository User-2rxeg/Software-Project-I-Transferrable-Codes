import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true, collection: 'feedback' })
export class Feedback {

    @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
    userId?: Types.ObjectId;

    @Prop({ type: String, required: true })
    message!: string;

    @Prop({ type: String, default: null })
    contactEmail?: string | null;

    @Prop({ type: String, default: 'general', index: true })
    category?: string; // Consider enum for Category for a list of options
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ createdAt: -1 });

