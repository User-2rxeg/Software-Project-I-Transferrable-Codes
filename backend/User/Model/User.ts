

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum UserRole {
    STUDENT = 'Student',
    INSTRUCTOR = 'Instructor',
    ADMIN = 'Admin',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {

    @Prop({required: true, trim: true})
    name!: string;

    @Prop({required: true, unique: true, index: true, lowercase: true, trim: true})
    email!: string;

    @Prop({required: true, select: false})
    passwordHash?: string;

    @Prop({type: String, enum: Object.values(UserRole), default: UserRole.STUDENT, index: true})
    role?: UserRole;

    @Prop({default: false})
    isEmailVerified?: boolean;

    @Prop({type: String, default: null})
    otpCode?: string | null;

    @Prop({type: Date, default: null})
    otpExpiresAt?: Date | null;

    @Prop({type: String, default: null})
    passwordResetOtpCode?: string | null;

    @Prop({type: Date, default: null})
    passwordResetOtpExpiresAt?: Date | null;

    @Prop({type: Date, default: null})
    deletedAt?: Date | null;

    createdAt!: Date;
    updatedAt!: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);


function stripSecrets(_doc: any, ret: any) {
    if (ret) {
        delete ret.passwordHash;
    }
    return ret;
}
UserSchema.set('toJSON', { versionKey: false, transform: stripSecrets });

UserSchema.set('toObject', { versionKey: false, transform: stripSecrets });

UserSchema.index({ createdAt: -1 });




