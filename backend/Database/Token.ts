// src/Database/BlacklistedToken.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';


export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;

@Schema({ timestamps: true, collection: 'blacklisted_tokens' })
export class BlacklistedToken {
    @Prop({ type: String }) token?: string;     // for token-based invalidation
    @Prop({ type: String }) userId?: string;    // for user-wide invalidation
    @Prop({ type: Date, required: true }) expiresAt!: Date;

    @Prop({ type: String, index: true })
    jti?: string; // optional if you rotate refresh tokens


}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
// BlacklistedTokenSchema.index({ userId: 1, expiresAt: 1 });
// BlacklistedTokenSchema.index({ token: 1 });
// BlacklistedTokenSchema.index({ jti: 1 });

// export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;

// @Schema({ timestamps: true, collection: 'blacklisted_tokens' })
// export class BlacklistedToken {
//     @Prop({ type: Types.ObjectId, ref: 'User', index: true })
//     userId?: Types.ObjectId;
//
//     @Prop({ type: String, index: true })
//     jti?: string; // token id if you issue one
//
//     @Prop({ type: Date, required: true, index: true })
//     expiresAt!: Date;
// }
//
// export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
// BlacklistedTokenSchema.index({ userId: 1, expiresAt: 1 });


// export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;
//
// @Schema({ timestamps: true })
// export class BlacklistedToken {
//     @Prop({ required: true })
//     token?: string;
//
//     @Prop({ required: true })
//     expiresAt?: Date;
//
//     constructor(partial: Partial<BlacklistedToken>) {
//         Object.assign(this, partial);
//     }
// }
//
// export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);



// export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;
//
// @Schema({ timestamps: true })
// export class BlacklistedToken {
//     @Prop() token?: string;        // optional (for access-token blacklist)
//     @Prop() jti?: string;          // preferred for refresh tokens
//     @Prop({ required: true }) expiresAt!: Date;
// }
// export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
//
// // helpful indexes:
// BlacklistedTokenSchema.index({ jti: 1 }, { unique: false });
// BlacklistedTokenSchema.index({ token: 1 }, { unique: false });
// BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
