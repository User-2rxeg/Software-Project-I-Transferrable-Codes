import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {Logs} from "./Logs";



export type AuditLogDocument = HydratedDocument<AuditLog>;

// @Model()
@Schema()
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
    userId!: Types.ObjectId;

    @Prop({ type: String, required: true, enum:Object.values(Logs), index: true })
    event!: Logs;

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date = new Date();

    @Prop({ type: Object, default: {} })
    details: Record<string, any> = {};
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, event: 1, timestamp: -1 });
AuditLogSchema.index({ event: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
