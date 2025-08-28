import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema()
export class AuditLog {
    //@Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true, required: false })
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId!: Types.ObjectId;

    //@Prop({ type: String, required: true, index: true })
    @Prop({ type: String, required: true })
    event!: string;

    //@Prop({ type: Date, default: Date.now, index: true })
    // timestamp!: Date;
    @Prop({ type: Date, default: Date.now })
    timestamp: Date = new Date();

    //// Mixed for flexibility; consider Map<String, any> if you want key-level control
    // @Prop({ type: SchemaTypes.Mixed, default: {} })
    // details!: Record<string, any>;

    @Prop({ type: Object, default: {} })
    details: Record<string, any> = {};
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, event: 1, timestamp: -1 });
AuditLogSchema.index({ event: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });