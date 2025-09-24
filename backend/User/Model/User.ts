

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

    @Prop({default: false})
    mfaEnabled?: boolean;

    @Prop({type: String, default: null, select: false})
    mfaSecret?: string | null;

    @Prop({type: [String], default: [], select: false})
    mfaBackupCodes?: string[];

    @Prop({type: Date, default: null})
    deletedAt?: Date | null;

    createdAt!: Date;
    updatedAt!: Date;

    @Prop({default: 0, index: true})
    unreadNotificationCount?: number;

    @Prop({
        type: [
            {
                _id: {type: Types.ObjectId, ref: 'Notification'},
                message: String,
                createdAt: Date,
                read: Boolean,
            },
        ],
        default: [],
        select: false, // optional: hide by default
    })
    notificationsPreview?: { _id: Types.ObjectId; message: string; createdAt: Date; read: boolean }[];
//CHECK THE STYLE OF THE NOTIFICATIONS REFERENCE NOTIFICATION COLLECTION IN REFERENCE TO USER OR EMBEDDED DOCUMENTS IN THE USER DOCUMENT
}
    export const UserSchema = SchemaFactory.createForClass(User);

// Global JSON safeguards (belt & suspenders)
function stripSecrets(_doc: any, ret: any) {
    if (ret) {
        delete ret.passwordHash;
        delete ret.mfaSecret;
        delete ret.mfaBackupCodes;
    }
    return ret;
}
UserSchema.set('toJSON', { versionKey: false, transform: stripSecrets });
UserSchema.set('toObject', { versionKey: false, transform: stripSecrets });

// Helpful compound indexes for search/pagination
UserSchema.index({ createdAt: -1 });




// import { Prop, Model, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument, Types } from 'mongoose';

//export type UserDocument = HydratedDocument<User>;


// MAKE ALL CAPITAL TO AVOID CONFUSION

// @Model({ timestamps: true })
// export class User {
//
//     @Prop({ required: true })
//     name!: string;
//
//     @Prop({ required: true, unique: true })
//     email!: string;
//
//     @Prop({ required: true })
//     password!: string;
//
//     @Prop({ enum: Object.values(UserRole), default: UserRole.STUDENT})  // <-- FIXED Enum Binding
//     role!: UserRole;
//
//     @Prop({ default: false })
//     isEmailVerified!: boolean;
//
//     // @Prop()
//     // profileImage?: string;
//     //
//     // @Prop({ type: [String], default: [] })
//     // learningPreferences?: string[];
//     //
//     // @Prop({ type: [String], default: [] })
//     // subjectsOfInterest?: string[];
//     //
//     // @Prop({ type: [String], default: [] })
//     // expertise?: string[];
//     //
//     // @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
//     // teachingCourses?: Types.ObjectId[];
//     //
//     // @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
//     // enrolledCourses?: Types.ObjectId[];
//     //
//     // @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
//     // completedCourses?: Types.ObjectId[];
//     //
//     // @Prop({ default: 0 })
//     // averageScore?: number;
//
//     @Prop({ type: String, required: false })
//     otpCode?: string | null;
//
//     @Prop({ type: Date, required: false })
//     otpExpiresAt?: Date | null;
//
//     @Prop({ type: String, required: false })
//     passwordResetOtpCode?: String | null;
//
//     @Prop({ type: Date, required: false })
//     passwordResetOtpExpiresAt?: Date | null;
//     // add/adjust these props
//     @Prop({ default: false })
//     mfaEnabled?: boolean;
//
//     @Prop({ type: String, default: null, select: false }) // HIDE from queries by default
//     mfaSecret?: string | null;
//
//     @Prop({ type: [String], default: [], select: false }) // HIDE backup codes
//     mfaBackupCodes?: string[];
//
//
//     @Prop({
//         type: [
//             {
//                 type: { type: String },
//                 message: String,
//                 read: { type: Boolean, default: false },
//                 date: { type: Date, default: Date.now },
//             },
//         ],
//         default: [],
//     })
//     notifications?: {
//         type: string;
//         message: string;
//         read: boolean;
//         date: Date;
//     }[];
// }
//
// export const UserSchema = SchemaFactory.createForClass(User);
//
//
//
//
//
//
// UserSchema.set('toJSON', {
//     versionKey: false,
//     transform: (_doc, ret: any) => {
//         if (ret?.password) {
//             delete ret.password;
//         }
//         return ret;
//     },
// });
//
// UserSchema.set('toObject', {
//     versionKey: false,
//     transform: (_doc, ret: any) => {
//         if (ret?.password) {
//             delete ret.password;
//         }
//         return ret;
//     },
// });