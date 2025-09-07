import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
    private blacklistedTokens: Set<string> = new Set();

    addToBlacklist(token: string): void {
        this.blacklistedTokens.add(token);
    }

    isBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }

    // async addToBlacklist(params: { userId?: string; jti?: string; ttlSeconds: number }) {
    //     const expiresAt = new Date(Date.now() + Math.max(60, params.ttlSeconds) * 1000);
    //     return this.model.create({
    //         userId: params.userId ? new Types.ObjectId(params.userId) : undefined,
    //         jti: params.jti,
    //         expiresAt,
    //     });
    // }
    //
    // async isBlacklisted(params: { userId?: string; jti?: string }) {
    //     const q: FilterQuery<BlacklistedTokenDocument> = { expiresAt: { $gt: new Date() } };
    //     if (params.userId) q.userId = new Types.ObjectId(params.userId);
    //     if (params.jti) q.jti = params.jti;
    //     const hit = await this.model.exists(q);
    //     return !!hit;
    // }
    //
    // async countActive() {
    //     return this.model.countDocuments({ expiresAt: { $gt: new Date() } }).exec();
    // }
    //
    // async purgeExpired() {
    //     const { deletedCount } = await this.model.deleteMany({ expiresAt: { $lte: new Date() } });
    //     return { deletedCount };
    // }
}
