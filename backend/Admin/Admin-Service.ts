
import {Injectable, NotFoundException, Optional} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {NotificationService} from "../Communication/Notification/Notification-Service";
import {AuditLogService} from "../Audit-Log/Audit-Log.Service";
import {User, UserDocument, UserRole} from "../Database/User";
import {AuditEvent, AuditLog, AuditLogDocument} from "../Database/Audit-Log";
import {NotificationDocument, NotificationType,Notification} from "../Database/Notification";
import {NotificationAuditLog, NotificationAuditLogDocument} from "../Database/Notification-Log";
import {BackupService} from "../Backup/Backup-Service";
import {BlacklistedToken, BlacklistedTokenDocument} from "../Database/Token";
import path from 'path';


import { promises as fsp } from 'node:fs';
import {TokenBlacklistService} from "../Authentication/Module/Token/BlackList-Token.Service";

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private readonly users: Model<UserDocument>,
        @InjectModel(Notification.name) private readonly notifs: Model<NotificationDocument>,
        @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
        private readonly notificationsSvc: NotificationService,
        private readonly audit: AuditLogService,
       @Optional() private readonly blacklist?: TokenBlacklistService, // optional DI (if provided by AuthModule)
    ) {
    }

    // ---------- USERS LIST ----------
    async listUsers(params: {
        q?: string;
        role?: UserRole;
        verified?: 'true' | 'false';
        page?: number;
        limit?: number;
    }) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

        const q: FilterQuery<UserDocument> = {};
        if (params.role) q.role = params.role;
        if (params.verified) q.isEmailVerified = params.verified === 'true';
        if (params.q) {
            q.$or = [
                {name: {$regex: params.q, $options: 'i'}},
                {email: {$regex: params.q, $options: 'i'}},
            ];
        }

        const [items, total] = await Promise.all([
            this.users
                .find(q, {passwordHash: 0, mfaSecret: 0, mfaBackupCodes: 0})
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.users.countDocuments(q).exec(),
        ]);

        return {items, total, page, limit, pages: Math.ceil(total / limit)};
    }

    // ---------- METRICS DASHBOARD ----------
    async metrics() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            byRoleAgg,
            verifiedCount,
            unverifiedCount,
            mfaEnabledCount,
            unreadNotifs,
            failedLogins24h,
            unauthorized24h,
            blacklisted24h,
            activeUsers7d,
        ] = await Promise.all([
            this.users.countDocuments({}).exec(),
            this.users.aggregate<{ _id: UserRole; count: number }>([
                {$group: {_id: '$role', count: {$sum: 1}}},
            ]),
            this.users.countDocuments({isEmailVerified: true}).exec(),
            this.users.countDocuments({isEmailVerified: false}).exec(),
            this.users.countDocuments({mfaEnabled: true}).exec(),
            this.notifs.countDocuments({read: false}).exec(),
            this.auditModel.countDocuments({event: AuditEvent.LOGIN_FAILED, timestamp: {$gte: dayAgo}}).exec(),
            this.auditModel.countDocuments({event: AuditEvent.UNAUTHORIZED_ACCESS, timestamp: {$gte: dayAgo}}).exec(),
            this.auditModel.countDocuments({event: AuditEvent.TOKEN_BLACKLISTED, timestamp: {$gte: dayAgo}}).exec(),
            this.auditModel.distinct('userId', {timestamp: {$gte: weekAgo}}) as any,
        ]);

        const byRole: Record<string, number> = {};
        byRoleAgg.forEach((r) => (byRole[r._id ?? 'unknown'] = r.count));

        return {
            users: {
                total: totalUsers,
                byRole,
                verified: verifiedCount,
                unverified: unverifiedCount,
                mfaEnabled: mfaEnabledCount,
            },
            notifications: {unreadTotal: unreadNotifs},
            security: {
                failedLogins24h,
                unauthorizedAccess24h: unauthorized24h,
                tokenBlacklisted24h: blacklisted24h,
                activeUsers7d: Array.isArray(activeUsers7d) ? activeUsers7d.filter(Boolean).length : 0,
            },
            generatedAt: now.toISOString(),
        };
    }

    // ---------- SECURITY SNAPSHOT ----------
    async securityOverview(params?: { limit?: number; from?: string; to?: string }) {
        const limit = Math.min(200, Math.max(1, Number(params?.limit ?? 50)));
        const to = params?.to ? new Date(params.to) : new Date();
        const from = params?.from ? new Date(params.from) : new Date(to.getTime() - 24 * 60 * 60 * 1000);

        const q: FilterQuery<AuditLogDocument> = {
            timestamp: {$gte: from, $lte: to},
            event: {$in: [AuditEvent.LOGIN_FAILED, AuditEvent.UNAUTHORIZED_ACCESS, AuditEvent.TOKEN_BLACKLISTED, AuditEvent.RBAC_DENIED]},
        };

        const items = await this.auditModel.find(q).sort({timestamp: -1}).limit(limit).lean().exec();

        return {
            window: {from: from.toISOString(), to: to.toISOString()},
            count: items.length,
            items,
        };
    }

    // ---------- ADMIN ACTIONS ----------
    async lockUser(userId: string, adminId: string) {
        const doc = await this.users.findByIdAndUpdate(userId, {deletedAt: new Date()}, {new: true}).exec();
        if (!doc) throw new NotFoundException('User not found');
        await this.audit.record(AuditEvent.ADMIN_USER_LOCK, adminId, {userId});
        return {success: true};
    }

    async unlockUser(userId: string, adminId: string) {
        const doc = await this.users.findByIdAndUpdate(userId, {deletedAt: null}, {new: true}).exec();
        if (!doc) throw new NotFoundException('User not found');
        await this.audit.record(AuditEvent.ADMIN_USER_UNLOCK, adminId, {userId});
        return {success: true};
    }

    // async forceLogoutUser(userId: string, adminId: string, token: string) {
    //     if (!this.blacklist) {
    //         await this.audit.record(AuditEvent.ADMIN_FORCE_LOGOUT, adminId, {
    //             userId,
    //             note: 'BlacklistService not available',
    //         });
    //         return { success: true, note: 'BlacklistService not available; only logged event' };
    //     }
    //
    //     await this.blacklist.addToBlacklist(token);
    //     await this.audit.record(AuditEvent.ADMIN_FORCE_LOGOUT, adminId, { userId });
    //     await this.audit.record(AuditEvent.TOKEN_BLACKLISTED, adminId, { userId });
    //     return { success: true };
    // }

    async exportUsersCSV(): Promise<{ filepath: string }> {
        const rows = await this.users
            .find({}, {_id: 1, name: 1, email: 1, role: 1, isEmailVerified: 1, createdAt: 1})
            .sort({createdAt: -1})
            .lean()
            .exec();

        const headers = ['id', 'name', 'email', 'role', 'verified', 'createdAt'];
        const lines = [headers.join(',')];
        for (const r of rows) {
            const vals = [
                String(r._id),
                `"${(r.name ?? '').replace(/"/g, '""')}"`,
                `"${(r.email ?? '').replace(/"/g, '""')}"`,
                String(r.role ?? ''),
                String(!!r.isEmailVerified),
                (r.createdAt as any)?.toISOString?.() ?? '',
            ];
            lines.push(vals.join(','));
        }

        const dir = path.resolve(process.cwd(), 'exports');
        await fsp.mkdir(dir, {recursive: true});
        const filepath = path.join(dir, `users-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
        await fsp.writeFile(filepath, lines.join('\n'), 'utf8');
        return {filepath};
    }

    // ---------- ANNOUNCEMENTS ----------
    async announceAll(adminId: string, message: string) {
        const chunkSize = 500;
        const total = await this.users.countDocuments().exec();
        for (let skip = 0; skip < total; skip += chunkSize) {
            const ids = await this.users.find({}, {_id: 1}).skip(skip).limit(chunkSize).lean().exec();
            for (const u of ids) {
                await this.notificationsSvc.createNotification(
                    {recipientId: String((u as any)._id), type: NotificationType.Announcement, message},
                    adminId,
                );
            }
        }
        await this.audit.record(AuditEvent.ADMIN_ANNOUNCE_ALL, adminId, {messageLen: message.length});
        return {ok: true};
    }

    async announceRole(adminId: string, role: UserRole, message: string) {
        const chunkSize = 500;
        const total = await this.users.countDocuments({role}).exec();
        for (let skip = 0; skip < total; skip += chunkSize) {
            const ids = await this.users.find({role}, {_id: 1}).skip(skip).limit(chunkSize).lean().exec();
            for (const u of ids) {
                await this.notificationsSvc.createNotification(
                    {recipientId: String((u as any)._id), type: NotificationType.Announcement, message},
                    adminId,
                );
            }
        }
        await this.audit.record(AuditEvent.ADMIN_ANNOUNCE_ROLE, adminId, {role, messageLen: message.length});
        return {ok: true};
    }

}
// @Injectable()
// export class AdminService {
//     constructor(
//         @InjectModel(User.name) private readonly users: Model<UserDocument>,
//         @InjectModel(Notification.name) private readonly notifs: Model<NotificationDocument>,
//         @InjectModel(NotificationAuditLog.name)
//         private readonly nlogs: Model<NotificationAuditLogDocument>,
//         @InjectModel(BlacklistedToken.name)
//         private readonly blacklist: Model<BlacklistedTokenDocument>,
//
//         private readonly notificationsSvc: NotificationService,
//         private readonly audit: AuditLogService,
//         private readonly backups: BackupService,
//     ) {}
//
//     // ---------- USERS LIST ----------
//     async listUsers(params: {
//         q?: string;
//         role?: UserRole;
//         verified?: 'true' | 'false';
//         page?: number;
//         limit?: number;
//     }) {
//         const page = Math.max(1, Number(params.page) || 1);
//         const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
//         const skip = (page - 1) * limit;
//
//         const q: FilterQuery<UserDocument> = {};
//         if (params.role) q.role = params.role;
//         if (params.verified) q.isEmailVerified = params.verified === 'true';
//         if (params.q) {
//             q.$or = [
//                 { name: { $regex: params.q, $options: 'i' } },
//                 { email: { $regex: params.q, $options: 'i' } },
//             ];
//         }
//
//         const [items, total] = await Promise.all([
//             this.users
//                 .find(q, { passwordHash: 0, mfaSecret: 0, mfaBackupCodes: 0 })
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean()
//                 .exec(),
//             this.users.countDocuments(q).exec(),
//         ]);
//         return { items, total, page, limit, pages: Math.ceil(total / limit) };
//     }
//
//     // ---------- METRICS DASHBOARD ----------
//     async metrics() {
//         const now = new Date();
//         const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//         const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//
//         const [
//             totalUsers,
//             byRole,
//             verifiedCount,
//             unverifiedCount,
//             mfaEnabledCount,
//             unreadNotifs,
//             failedLogins24h,
//             suspicious24h,
//             blacklistCount,
//             activeUsers7d,
//         ] = await Promise.all([
//             this.users.countDocuments({}).exec(),
//             this.users
//                 .aggregate<{ _id: UserRole; count: number }>([
//                     { $group: { _id: '$role', count: { $sum: 1 } } },
//                 ])
//                 .exec(),
//             this.users.countDocuments({ isEmailVerified: true }).exec(),
//             this.users.countDocuments({ isEmailVerified: false }).exec(),
//             this.users.countDocuments({ mfaEnabled: true }).exec(),
//             this.notifs.countDocuments({ read: false }).exec(),
//             // Assuming you record login failures in AuditLog as 'AUTH_LOGIN_FAILED'
//             this.nlogs.countDocuments({ eventType: 'SENT', createdAt: { $gte: dayAgo } }).exec(), // placeholder; see note below
//             // Suspicious: infer from AuditLog service if you log events like 'AUTH_LOGIN_FAILED', 'TOKEN_BLACKLISTED', 'RBAC_DENIED'
//             // Here we assume NotificationAuditLog is separate from general AuditLog—if you have a general AuditLog model, swap it in.
//             Promise.resolve(0), // replace when general AuditLog model is injected
//             this.blacklist.countDocuments({}).exec(),
//             // Rough active users: distinct users who generated any notification events in last 7d (proxy for activity)
//             this.nlogs.distinct('userId', { createdAt: { $gte: weekAgo } }) as any,
//         ]);
//
//         const byRoleObj: Record<string, number> = {};
//         byRole.forEach((r) => (byRoleObj[r._id ?? 'Unknown'] = r.count));
//
//         return {
//             users: {
//                 total: totalUsers,
//                 byRole: byRoleObj,
//                 verified: verifiedCount,
//                 unverified: unverifiedCount,
//                 mfaEnabled: mfaEnabledCount,
//             },
//             notifications: {
//                 unreadTotal: unreadNotifs,
//             },
//             security: {
//                 failedLogins24h, // TODO: wire real general AuditLog events
//                 suspiciousEvents24h: suspicious24h,
//                 blacklistCount,
//                 activeUsers7d: Array.isArray(activeUsers7d) ? activeUsers7d.length : 0,
//             },
//             generatedAt: now.toISOString(),
//         };
//     }
//
//     // ---------- SECURITY SNAPSHOT ----------
//     async securityOverview(limit = 50) {
//         const now = new Date();
//         const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//
//         const [blacklistCount] = await Promise.all([
//             this.blacklist.countDocuments({}).exec(),
//         ]);
//
//         // If you have a GENERAL AuditLog model (not notification audit), plug it here:
//         // Example events: AUTH_LOGIN_FAILED, TOKEN_BLACKLISTED, RBAC_DENIED
//         const recent: Array<{ when: string; event: string; details?: any }> = [
//             // placeholder list until general AuditLog is wired into AdminModule
//         ];
//
//         return {
//             blacklistCount,
//             recent,
//             windowStart: dayAgo.toISOString(),
//             windowEnd: now.toISOString(),
//         };
//     }
//
//     // ---------- ANNOUNCEMENTS ----------
//     async announceAll(adminId: string, message: string) {
//         const chunkSize = 500;
//         const total = await this.users.countDocuments().exec();
//         for (let skip = 0; skip < total; skip += chunkSize) {
//             const ids = await this.users
//                 .find({}, { _id: 1 })
//                 .skip(skip)
//                 .limit(chunkSize)
//                 .lean()
//                 .exec();
//             for (const u of ids) {
//                 await this.notificationsSvc.createNotification(
//                     { recipientId: String((u as any)._id), type: NotificationType.Announcement, message },
//                     adminId,
//                 );
//             }
//         }
//         await this.audit.record(adminId, 'ADMIN_ANNOUNCE_ALL', { messageLen: message.length });
//         return { ok: true };
//     }
//
//     async announceRole(adminId: string, role: UserRole, message: string) {
//         const chunkSize = 500;
//         const total = await this.users.countDocuments({ role }).exec();
//         for (let skip = 0; skip < total; skip += chunkSize) {
//             const ids = await this.users
//                 .find({ role }, { _id: 1 })
//                 .skip(skip)
//                 .limit(chunkSize)
//                 .lean()
//                 .exec();
//             for (const u of ids) {
//                 await this.notificationsSvc.createNotification(
//                     { recipientId: String((u as any)._id), type: NotificationType.Announcement, message },
//                     adminId,
//                 );
//             }
//         }
//         await this.audit.record(adminId, 'ADMIN_ANNOUNCE_ROLE', { role, messageLen: message.length });
//         return { ok: true };
//     }
//
//     // ---------- BACKUPS (proxy to BackupService) ----------
//     createBackup(dto: { backupType: 'full' | 'incremental'; location: string }) {
//         return this.backups.createBackup(dto);
//     }
//     listBackups(limit = 20, page = 1) {
//         return this.backups.listBackups(limit, page);
//     }
//     restoreBackup(id: string) {
//         return this.backups.restore(id);
//     }
// }

// @Injectable()
// export class AdminService {
//     constructor(
//         @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//         private readonly notifications: NotificationService,
//         private readonly audit: AuditLogService,
//     ) {}
//
//     async listUsers(params: {
//         q?: string;
//         role?: UserRole;
//         verified?: 'true' | 'false';
//         page?: number;
//         limit?: number;
//     }) {
//         const page = Math.max(1, Number(params.page) || 1);
//         const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
//         const skip = (page - 1) * limit;
//
//         const q: FilterQuery<UserDocument> = {};
//         if (params.role) q.role = params.role;
//         if (params.verified) q.isEmailVerified = params.verified === 'true';
//         if (params.q) {
//             q.$or = [
//                 { name: { $regex: params.q, $options: 'i' } },
//                 { email: { $regex: params.q, $options: 'i' } },
//             ];
//         }
//
//         const [items, total] = await Promise.all([
//             this.userModel
//                 .find(q, { passwordHash: 0, mfaSecret: 0, mfaBackupCodes: 0 })
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean()
//                 .exec(),
//             this.userModel.countDocuments(q).exec(),
//         ]);
//
//         return { items, total, page, limit, pages: Math.ceil(total / limit) };
//     }
//
//     /**
//      * Announcement fan-out to ALL users (chunked).
//      * Uses NotificationService.createNotification per user to ensure audit + WS emit.
//      */
//     async announceAll(adminId: string, message: string) {
//         const chunkSize = 500; // tune based on infra
//         const total = await this.userModel.countDocuments().exec();
//         for (let skip = 0; skip < total; skip += chunkSize) {
//             const ids = await this.userModel
//                 .find({}, { _id: 1 })
//                 .skip(skip)
//                 .limit(chunkSize)
//                 .lean()
//                 .exec();
//
//             for (const u of ids) {
//                 await this.notifications.createNotification(
//                     { recipientId: String((u as any)._id), type: NotificationType.Announcement, message },
//                     adminId,
//                 );
//             }
//         }
//         await this.audit.record(adminId, 'ADMIN_ANNOUNCE_ALL', { messageLen: message.length });
//         return { ok: true };
//     }
//
//     /**
//      * Announcement fan-out to users by ROLE (chunked).
//      */
//     async announceRole(adminId: string, role: UserRole, message: string) {
//         const chunkSize = 500;
//         const total = await this.userModel.countDocuments({ role }).exec();
//         for (let skip = 0; skip < total; skip += chunkSize) {
//             const ids = await this.userModel
//                 .find({ role }, { _id: 1 })
//                 .skip(skip)
//                 .limit(chunkSize)
//                 .lean()
//                 .exec();
//
//             for (const u of ids) {
//                 await this.notifications.createNotification(
//                     { recipientId: String((u as any)._id), type: NotificationType.Announcement, message },
//                     adminId,
//                 );
//             }
//         }
//         await this.audit.record(adminId, 'ADMIN_ANNOUNCE_ROLE', { role, messageLen: message.length });
//         return { ok: true };
//     }
// }

// @Injectable()
// export class AdminService {
//     constructor(
//         @InjectModel('User') private readonly userModel: Model<UserDocument>,
//         @InjectModel('Notification') private readonly notifModel: Model<NotificationDocument>,
//         @InjectModel('AuditLog') private readonly auditModel: Model<AuditLogDocument>,
//
//         private readonly notifications: NotificationService,
//         private readonly audit: AuditLogService,
//     ) {}
//
//     // ---------- USERS LIST (existing) ----------
//     async listUsers(params: {
//         q?: string;
//         role?: UserRole;
//         verified?: 'true' | 'false';
//         page?: number;
//         limit?: number;
//     }) {
//         const page = Math.max(1, Number(params.page) || 1);
//         const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
//         const skip = (page - 1) * limit;
//
//         const q: FilterQuery<UserDocument> = {};
//         if (params.role) q.role = params.role;
//         if (params.verified) q.isEmailVerified = params.verified === 'true';
//         if (params.q) {
//             q.$or = [
//                 { name: { $regex: params.q, $options: 'i' } },
//                 { email: { $regex: params.q, $options: 'i' } },
//             ];
//         }
//
//         const [items, total] = await Promise.all([
//             this.userModel
//                 .find(q, { passwordHash: 0, mfaSecret: 0, mfaBackupCodes: 0 })
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit)
//                 .lean()
//                 .exec(),
//             this.userModel.countDocuments(q).exec(),
//         ]);
//         return { items, total, page, limit, pages: Math.ceil(total / limit) };
//     }
//
//     // ---------- METRICS DASHBOARD ----------
//     async metrics() {
//         const now = new Date();
//         const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//         const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//
//         const [
//             totalUsers,
//             byRoleAgg,
//             verifiedCount,
//             unverifiedCount,
//             mfaEnabledCount,
//             unreadNotifsTotal,
//             failedLogins24h,
//             unauthorized24h,
//             tokenBlacklisted24h,
//             activeUsersIds7d,
//         ] = await Promise.all([
//             this.userModel.countDocuments({}).exec(),
//             this.userModel.aggregate<{ _id: string; count: number }>([
//                 { $group: { _id: '$role', count: { $sum: 1 } } },
//             ]),
//             this.userModel.countDocuments({ isEmailVerified: true }).exec(),
//             this.userModel.countDocuments({ isEmailVerified: false }).exec(),
//             this.userModel.countDocuments({ mfaEnabled: true }).exec(),
//             this.notifModel.countDocuments({ read: false }).exec(),
//             this.auditModel.countDocuments({ event: 'LOGIN_FAILED', timestamp: { $gte: dayAgo } }).exec(),
//             this.auditModel.countDocuments({ event: 'UNAUTHORIZED_ACCESS', timestamp: { $gte: dayAgo } }).exec(),
//             this.auditModel.countDocuments({ event: 'TOKEN_BLACKLISTED', timestamp: { $gte: dayAgo } }).exec(),
//             this.auditModel.distinct('userId', { timestamp: { $gte: weekAgo } }),
//         ]);
//
//         const usersByRole: Record<string, number> = {};
//         for (const r of byRoleAgg) usersByRole[r._id || 'Unknown'] = r.count;
//
//         return {
//             users: {
//                 total: totalUsers,
//                 byRole: usersByRole,
//                 verified: verifiedCount,
//                 unverified: unverifiedCount,
//                 mfaEnabled: mfaEnabledCount,
//             },
//             notifications: {
//                 unreadTotal: unreadNotifsTotal,
//             },
//             security: {
//                 failedLogins24h,
//                 unauthorizedAccess24h: unauthorized24h,
//                 tokenBlacklisted24h,
//                 activeUsers7d: Array.isArray(activeUsersIds7d) ? activeUsersIds7d.filter(Boolean).length : 0,
//             },
//             generatedAt: now.toISOString(),
//         };
//     }
//
//     // ---------- SECURITY SNAPSHOT (recent events list) ----------
//     async securityOverview(params?: { limit?: number; from?: string; to?: string }) {
//         const limit = Math.min(200, Math.max(1, Number(params?.limit ?? 50)));
//         const to = params?.to ? new Date(params.to) : new Date();
//         const from = params?.from ? new Date(params.from) : new Date(to.getTime() - 24 * 60 * 60 * 1000);
//
//         const q: FilterQuery<AuditLogDocument> = {
//             timestamp: { $gte: from, $lte: to },
//             event: { $in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'TOKEN_BLACKLISTED', 'RBAC_DENIED'] },
//         };
//
//         const items = await this.auditModel
//             .find(q)
//             .sort({ timestamp: -1 })
//             .limit(limit)
//             .lean()
//             .exec();
//
//         return {
//             window: { from: from.toISOString(), to: to.toISOString() },
//             count: items.length,
//             items,
//         };
//     }
//
//     // ---------- ADMIN ACTIONS: LOCK / UNLOCK USERS (soft delete) ----------
//     async lockUser(userId: string, adminId: string) {
//         const res = await this.userModel.findByIdAndUpdate(
//             userId,
//             { deletedAt: new Date() },
//             { new: true },
//         ).exec();
//         if (!res) throw new NotFoundException('User not found');
//         await this.audit.log('ADMIN_USER_LOCK', adminId, { userId });
//         return { success: true };
//     }
//
//     async unlockUser(userId: string, adminId: string) {
//         const res = await this.userModel.findByIdAndUpdate(
//             userId,
//             { deletedAt: null },
//             { new: true },
//         ).exec();
//         if (!res) throw new NotFoundException('User not found');
//         await this.audit.log('ADMIN_USER_UNLOCK', adminId, { userId });
//         return { success: true };
//     }
//}


// @Injectable()
// export class AdminService {
//     constructor(
//         @InjectModel('User')   private readonly userModel: Model<UserDocument>,
//         private readonly notifications: NotificationService,
//         private readonly audit:AuditLogService,
//     ) {}
//
//
//     async listUsers(params: { q?: string; role?: UserRole; verified?: 'true'|'false'; page?: number; limit?: number }) {
//         const page  = Math.max(1, Number(params.page) || 1);
//         const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
//         const skip  = (page - 1) * limit;
//
//         const q: FilterQuery<UserDocument> = {};
//         if (params.role) q.role = params.role;
//         if (params.verified) q.isEmailVerified = params.verified === 'true';
//         if (params.q) {
//             q.$or = [
//                 { name:  { $regex: params.q, $options: 'i' } },
//                 { email: { $regex: params.q, $options: 'i' } },
//             ];
//         }
//
//         const [items, total] = await Promise.all([
//             this.userModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
//             this.userModel.countDocuments(q).exec(),
//         ]);
//         return { items, total, page, limit, pages: Math.ceil(total/limit) };
//     }
//
//
//
//
//
//     //async announceAll(adminId: string, message: string) {
//         // send to all users (chunked to avoid huge fan-out)
//         //const cursor = this.userModel.find({}, { _id: 1 }).cursor();
//         //for await (const u of cursor) {
//           //  await this.notifications.createNotification({ recipientId: String(u._id), type: 'announcement', message }, adminId);
//         //}
//       //  return { ok: true };
//     //}
//
//     //async announceRole(adminId: string, role: UserRole, message: string) {
//         //const cursor = this.userModel.find({ role }, { _id: 1 }).cursor();
//         //for await (const u of cursor) {
//          //   await this.notifications.createNotification({ recipientId: String(u._id), type: 'announcement', message }, adminId);
//        // }
//       //  return { ok: true };
//     //}
//
//     // async announceAll(adminId: string, message: string) {
//     //     const cursor = this.userModel.find({}, { _id: 1 }).cursor();
//     //     for await (const u of cursor) {
//     //         await this.notifications.createNotification({ recipientId: String((u as any)._id), type: 'announcement', message }, adminId);
//     //     }
//     //     return { ok: true };
//     // }
//     //
//     //
//     // async announceRole(adminId: string, role: UserRole, message: string) {
//     //     const cursor = this.userModel.find({ role }, { _id: 1 }).cursor();
//     //     for await (const u of cursor) {
//     //         await this.notifications.createNotification({ recipientId: String((u as any)._id), type: 'announcement', message }, adminId);
//     //     }
//     //     return { ok: true };
//     // }
//
//
//
//
//
//
//}