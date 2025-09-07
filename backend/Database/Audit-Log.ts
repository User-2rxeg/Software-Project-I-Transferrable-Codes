import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AuditEvent {
    LOGIN_FAILED = 'LOGIN_FAILED',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
    RBAC_DENIED = 'RBAC_DENIED',
    ADMIN_USER_LOCK = 'ADMIN_USER_LOCK',
    ADMIN_USER_UNLOCK = 'ADMIN_USER_UNLOCK',
    ADMIN_FORCE_LOGOUT = 'ADMIN_FORCE_LOGOUT',
    ADMIN_ANNOUNCE_ALL = 'ADMIN_ANNOUNCE_ALL',
    ADMIN_ANNOUNCE_ROLE = 'ADMIN_ANNOUNCE_ROLE',
}
export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema()
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
    userId!: Types.ObjectId;

    @Prop({ type: String, required: true, index: true })
    event!: string; // use AuditEvent in code

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date = new Date();

    @Prop({ type: Object, default: {} })
    details: Record<string, any> = {};
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ userId: 1, event: 1, timestamp: -1 });
AuditLogSchema.index({ event: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// export type AuditLogDocument = HydratedDocument<AuditLog>;
//
// @Schema()
// export class AuditLog {
//     //@Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true, required: false })
//     @Prop({ type: Types.ObjectId, ref: 'User' })
//     userId!: Types.ObjectId;
//
//     //@Prop({ type: String, required: true, index: true })
//     @Prop({ type: String, required: true })
//     event!: AuditEvent;
//
//     //@Prop({ type: Date, default: Date.now, index: true })
//     // timestamp!: Date;
//     @Prop({ type: Date, default: Date.now })
//     timestamp: Date = new Date();
//
//     //// Mixed for flexibility; consider Map<String, any> if you want key-level control
//     // @Prop({ type: SchemaTypes.Mixed, default: {} })
//     // details!: Record<string, any>;
//
//     @Prop({ type: Object, default: {} })
//     details: Record<string, any> = {};
// }
//
// export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
//
// AuditLogSchema.index({ userId: 1, event: 1, timestamp: -1 });
// AuditLogSchema.index({ event: 1, timestamp: -1 });
// AuditLogSchema.index({ userId: 1, timestamp: -1 });