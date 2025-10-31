import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document, HydratedDocument} from 'mongoose';
import {User} from "../../User/Model/User";

export type BlackListedTokenDocument = HydratedDocument<BlacklistedToken>;

@Schema({ timestamps: true })
export class BlacklistedToken {
    @Prop({ required: true, unique: true })
    token!: string;

    @Prop({ required: true })
    expiresAt?: Date;
}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
