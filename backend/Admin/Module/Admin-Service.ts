import {BadRequestException, Injectable, NotFoundException, Optional} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {FilterQuery, Model} from 'mongoose';
import {NotificationService} from "../../Communication/Notification/Module/Notification-Service";
import {AuditLogService} from "../../Audit-Log/Module/Audit-Log.Service";
import {User, UserDocument, UserRole} from "../../User/Model/User";
import {Logs} from '../../Audit-Log/Model/Logs'
import {
    Notification,
    NotificationDocument,
    NotificationType
} from "../../Communication/Notification/Models/Notification";
import path from 'path';


import {promises as fsp} from 'node:fs';

import {CreateUserDto} from "../../User/Validator/User-Validator";
import * as bcrypt from "bcrypt";
import {AuditLog, AuditLogDocument} from "../../Audit-Log/Model/Audit-Log";

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private readonly users: Model<UserDocument>,
        @InjectModel(Notification.name) private readonly notifs: Model<NotificationDocument>,
        @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
        private readonly notificationsSvc: NotificationService,
        private readonly audit: AuditLogService,
       //@Optional() private readonly blacklist?: TokenBlacklistService, // optional DI (if provided by AuthModule)
    ) {
    }


    async createUserByAdmin(dto: CreateUserDto, adminId: string) {
        const user = await this.users.create({
            ...dto,
            passwordHash: await bcrypt.hash(dto.password, 10),
        });

        await this.audit.record(Logs.ADMIN_CREATED_USER, adminId, {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        });

        return user;
    }


    async updateUserRole(userId: string, adminId: string, newRole: UserRole) {
        const doc = await this.users.findByIdAndUpdate(userId, { role: newRole }, { new: true }).exec();

        if (!doc) throw new NotFoundException('User not found');

        await this.audit.record(Logs.ROLE_CHANGED, adminId, { userId, newRole });

        return this.users.findById(userId).lean().exec();
    }


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



    async metrics() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24*60*60*1000);
        const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);

        const [
            totalUsers,
            byRoleAgg,
            verifiedCount,
            unverifiedCount,
            mfaEnabledCount,
            unreadNotifs,
            failedLogins24h,
            unauthorized24h,
            tokenBlacklisted24h,
            loginSuccess24h,
            passwordResetRequests24h,
            newRegistrations24h,
            distinctActiveUsers7d,
        ] = await Promise.all([
            this.users.countDocuments({}).exec(),
            this.users.aggregate<{ _id: UserRole; count: number }>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
            this.users.countDocuments({ isEmailVerified: true }).exec(),
            this.users.countDocuments({ isEmailVerified: false }).exec(),
            this.users.countDocuments({ mfaEnabled: true }).exec(),
            this.notifs.countDocuments({ read: false }).exec(),
            this.auditModel.countDocuments({ event: Logs.LOGIN_FAILED, timestamp: { $gte: dayAgo } }).exec(),
            this.auditModel.countDocuments({ event: Logs.UNAUTHORIZED_ACCESS, timestamp: { $gte: dayAgo } }).exec(),
            this.auditModel.countDocuments({ event: Logs.TOKEN_BLACKLISTED, timestamp: { $gte: dayAgo } }).exec(),
            this.auditModel.countDocuments({ event: Logs.LOGIN_SUCCESS, timestamp: { $gte: dayAgo } }).exec(),
            this.auditModel.countDocuments({ event: Logs.PASSWORD_RESET_REQUESTED, timestamp: { $gte: dayAgo } }).exec(),
            this.users.countDocuments({ createdAt: { $gte: dayAgo } }).exec(),
            this.auditModel.distinct('userId', { timestamp: { $gte: weekAgo } }).exec(),
        ]);

        const byRole: Record<string, number> = {};
        byRoleAgg.forEach(r => byRole[r._id ?? 'unknown'] = r.count);

        const activeUsers7d = Array.isArray(distinctActiveUsers7d) ? distinctActiveUsers7d.filter(Boolean).length : 0;
        const mfaEnabledPercent = totalUsers ? Math.round((mfaEnabledCount / totalUsers) * 10000) / 100 : 0;
        const verifiedPercent = totalUsers ? Math.round((verifiedCount / totalUsers) * 10000) / 100 : 0;

        return {
            users: {
                total: totalUsers,
                byRole,
                verified: verifiedCount,
                unverified: unverifiedCount,
                verifiedPercent,
                mfaEnabled: mfaEnabledCount,
                mfaEnabledPercent,
                newRegistrations24h,
            },
            notifications: { unreadTotal: unreadNotifs },
            security: {
                failedLogins24h,
                unauthorizedAccess24h: unauthorized24h,
                tokenBlacklisted24h,
                loginSuccess24h,
                passwordResetRequests24h,
                activeUsers7d,
            },
            generatedAt: now.toISOString(),
        };
    }


    async securityOverview(params?: { limit?: number; from?: string; to?: string }) {
        const limit = Math.min(200, Math.max(1, Number(params?.limit ?? 50)));
        const to = params?.to ? new Date(params.to) : new Date();
        const from = params?.from ? new Date(params.from) : new Date(to.getTime() - 24 * 60 * 60 * 1000);

        const q: FilterQuery<AuditLogDocument> = {
            timestamp: {$gte: from, $lte: to},
            event: {$in: [Logs.LOGIN_FAILED, Logs.UNAUTHORIZED_ACCESS, Logs.TOKEN_BLACKLISTED, Logs.RBAC_DENIED, Logs.ADMIN_FORCE_LOGOUT, Logs.ADMIN_USER_LOCK, Logs.ADMIN_USER_UNLOCK,Logs.MFA_ENABLED, Logs.MFA_DISABLED]},
        };



        const items = await this.auditModel.find(q).sort({timestamp: -1}).limit(limit).lean().exec();

        return {
            window: {from: from.toISOString(), to: to.toISOString()},
            count: items.length,
            items,
        };
    }



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
        await this.audit.record(Logs.ADMIN_ANNOUNCE_ALL, adminId, {messageLen: message.length});
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
        await this.audit.record(Logs.ADMIN_ANNOUNCE_ROLE, adminId, {role, messageLen: message.length});
        return {ok: true};
    }



}


//     async updateUserRole(userId: string, newRole: UserRole): Promise<any> {
//         const updatedUser = await this.users.findByIdAndUpdate(userId, { role: newRole }, { new: true }).exec();
//         if (!updatedUser) throw new NotFoundException('User not found');
//
//         return this.toPublic(updatedUser);
//     }
//
//
