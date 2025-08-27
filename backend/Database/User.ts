import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
    STUDENT = 'student',
    INSTRUCTOR = 'instructor',
    ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {

    @Prop({ required: true })
    name!: string;

    @Prop({ required: true, unique: true })
    email!: string;

    @Prop({ required: true })
    password!: string;

    @Prop({ enum: Object.values(UserRole), default: UserRole.STUDENT })  // <-- FIXED Enum Binding
    role!: UserRole;

    @Prop({ default: false })
    isEmailVerified!: boolean;

    @Prop()
    profileImage?: string;

    @Prop({ type: [String], default: [] })
    learningPreferences?: string[];

    @Prop({ type: [String], default: [] })
    subjectsOfInterest?: string[];

    @Prop({ type: [String], default: [] })
    expertise?: string[];

    @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
    teachingCourses?: Types.ObjectId[];

    @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
    enrolledCourses?: Types.ObjectId[];

    @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] })
    completedCourses?: Types.ObjectId[];

    @Prop({ default: 0 })
    averageScore?: number;

    @Prop({ type: String, required: false })
    otpCode?: string | null;

    @Prop({ type: Date, required: false })
    otpExpiresAt?: Date | null;

    @Prop({ type: String, required: false })
    passwordResetOtpCode?: String | null;

    @Prop({ type: Date, required: false })
    passwordResetOtpExpiresAt?: Date | null;
    // add/adjust these props
    @Prop({ default: false })
    mfaEnabled?: boolean;

    @Prop({ type: String, default: null, select: false }) // HIDE from queries by default
    mfaSecret?: string | null;

    @Prop({ type: [String], default: [], select: false }) // HIDE backup codes
    mfaBackupCodes?: string[];


    @Prop({
        type: [
            {
                type: { type: String },
                message: String,
                read: { type: Boolean, default: false },
                date: { type: Date, default: Date.now },
            },
        ],
        default: [],
    })
    notifications?: {
        type: string;
        message: string;
        read: boolean;
        date: Date;
    }[];
}

export const UserSchema = SchemaFactory.createForClass(User);


UserSchema.index({ email: 1 }, { unique: true });         // explicit unique
UserSchema.index({ name: 1 });                            // prefix search on name
//UserSchema.index({ email: 1, name: 1 });                  // compound to help mixed filters

UserSchema.index({ name: 'text', email: 'text' });


UserSchema.index({ role: 1, createdAt: -1 });



UserSchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret: any) => {
        if (ret?.password) {
            delete ret.password;
        }
        return ret;
    },
});

UserSchema.set('toObject', {
    versionKey: false,
    transform: (_doc, ret: any) => {
        if (ret?.password) {
            delete ret.password;
        }
        return ret;
    },
});
