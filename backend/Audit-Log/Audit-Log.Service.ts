
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {AuditLog, AuditLogDocument} from "../Database/Audit-Log";
import {CreateAuditLogDto, UpdateAuditLogDto} from "../Validators/Audit-Log.Validator";


@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name)
        private readonly auditModel: Model<AuditLogDocument>,
    ) {}

    // convenience helper
    async log(event: string, userId?: string, details?: Record<string, any>) {
        return this.auditModel.create({
            event,
            userId,
            details: details ?? {},
            timestamp: new Date(),
        });
    }

    async create(dto: CreateAuditLogDto) {
        return this.auditModel.create({
            ...dto,
            timestamp: dto.timestamp ?? new Date(),
        });
    }

    async findAll(
        page = 1,
        limit = 20,
        filters?: { userId?: string; event?: string; from?: string; to?: string },
    ) {
        const skip = (page - 1) * limit;
        const query: FilterQuery<AuditLogDocument> = {};

        if (filters?.userId) query.userId = filters.userId;
        if (filters?.event) query.event = filters.event;
        if (filters?.from || filters?.to) {
            query.timestamp = {};
            if (filters.from) query.timestamp.$gte = new Date(filters.from);
            if (filters.to) query.timestamp.$lte = new Date(filters.to);
        }

        const [items, total] = await Promise.all([
            this.auditModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
            this.auditModel.countDocuments(query).exec(),
        ]);

        return { items, total, page, limit };
    }

    async findOne(id: string) {
        const doc = await this.auditModel.findById(id).exec();
        if (!doc) throw new NotFoundException('Audit log not found');
        return doc;
    }

    async update(id: string, dto: UpdateAuditLogDto) {
        const doc = await this.auditModel.findByIdAndUpdate(id, dto, { new: true }).exec();
        if (!doc) throw new NotFoundException('Audit log not found');
        return doc;
    }

    async delete(id: string) {
        const res = await this.auditModel.findByIdAndDelete(id).exec();
        if (!res) throw new NotFoundException('Audit log not found');
        return { deleted: true };
    }

    async purgeOlderThan(days: number) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const { deletedCount } = await this.auditModel.deleteMany({ timestamp: { $lt: cutoff } });
        return { deletedCount };
    }
}