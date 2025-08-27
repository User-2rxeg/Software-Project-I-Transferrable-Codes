// src/Database/BlacklistedToken.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;

@Schema({ timestamps: true })
export class BlacklistedToken {
    @Prop({ required: true })
    token?: string;

    @Prop({ required: true })
    expiresAt?: Date;

    constructor(partial: Partial<BlacklistedToken>) {
        Object.assign(this, partial);
    }
}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
