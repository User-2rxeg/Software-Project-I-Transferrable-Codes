import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema()
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId!: Types.ObjectId;

    @Prop({ type: String, required: true })
    event!: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date = new Date();

    @Prop({ type: Object, default: {} })
    details: Record<string, any> = {};
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);


AuditLogSchema.index({ event: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });