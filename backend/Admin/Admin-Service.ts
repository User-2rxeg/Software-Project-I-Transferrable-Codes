
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {NotificationService} from "../Communication/Notification/Notification-Service";
import {AuditLogService} from "../Audit-Log/Audit-Log.Service";
import {UserDocument, UserRole} from "../Database/User";


@Injectable()
export class AdminService {
    constructor(
        @InjectModel('User')   private readonly userModel: Model<UserDocument>,
        private readonly notifications: NotificationService,
        private readonly audit:AuditLogService,
    ) {}


    async listUsers(params: { q?: string; role?: UserRole; verified?: 'true'|'false'; page?: number; limit?: number }) {
        const page  = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip  = (page - 1) * limit;

        const q: FilterQuery<UserDocument> = {};
        if (params.role) q.role = params.role;
        if (params.verified) q.isEmailVerified = params.verified === 'true';
        if (params.q) {
            q.$or = [
                { name:  { $regex: params.q, $options: 'i' } },
                { email: { $regex: params.q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.userModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.userModel.countDocuments(q).exec(),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total/limit) };
    }





    async announceAll(adminId: string, message: string) {
        // send to all users (chunked to avoid huge fan-out)
        const cursor = this.userModel.find({}, { _id: 1 }).cursor();
        for await (const u of cursor) {
            await this.notifications.createNotification({ recipientId: String(u._id), type: 'announcement', message }, adminId);
        }
        return { ok: true };
    }

    async announceRole(adminId: string, role: UserRole, message: string) {
        const cursor = this.userModel.find({ role }, { _id: 1 }).cursor();
        for await (const u of cursor) {
            await this.notifications.createNotification({ recipientId: String(u._id), type: 'announcement', message }, adminId);
        }
        return { ok: true };
    }










}