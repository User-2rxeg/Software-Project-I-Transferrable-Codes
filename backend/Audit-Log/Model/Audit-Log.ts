import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AuditEvent {

    EMAIL_VERIFIED = 'EMAIL_VERIFIED',
    USER_REGISTERED = 'USER_REGISTERED',
    USER_CHANGED_EMAIL = 'USER_CHANGED_EMAIL',
    OTP_SENT = 'OTP_SENT',
    OTP_SEND_FAILED = 'OTP_SEND_FAILED',

    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILED = 'LOGIN_FAILED',
    LOGOUT = 'LOGOUT',

    PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

    MFA_ENABLED = 'MFA_ENABLED',
    MFA_DISABLED = 'MFA_DISABLED',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    PROFILE_UPDATED = 'PROFILE_UPDATED',

    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    TOKEN_BLACKLISTED = 'TOKEN_BLACKLISTED',
    RBAC_DENIED = 'RBAC_DENIED',

    ADMIN_CREATED_USER = 'ADMIN_CREATED_USER',
    ADMIN_USER_LOCK = 'ADMIN_USER_LOCK',
    ADMIN_USER_UNLOCK = 'ADMIN_USER_UNLOCK',
    ADMIN_FORCE_LOGOUT = 'ADMIN_FORCE_LOGOUT',
    ADMIN_ANNOUNCE_ALL = 'ADMIN_ANNOUNCE_ALL',
    ROLE_CHANGED = 'ROLE_CHANGED',
    ADMIN_ANNOUNCE_ROLE = 'ADMIN_ANNOUNCE_ROLE',
    ADMIN_DELETE_USER = 'ADMIN_DELETE_USER',
    DATA_EXPORT = 'DATA_EXPORT',

    //DATA BACKUP CHAT CREATED, FEEDBACK CREATED, SENT, READ ADD MORE ETC...
}
export type AuditLogDocument = HydratedDocument<AuditLog>;

// @Model()
@Schema()
export class AuditLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
    userId!: Types.ObjectId;

    @Prop({ type: String, required: true, enum:Object.values(AuditEvent), index: true })
    event!: AuditEvent;

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date = new Date();

    @Prop({ type: Object, default: {} })
    details: Record<string, any> = {};
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, event: 1, timestamp: -1 });
AuditLogSchema.index({ event: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });



