import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {Feedback, FeedbackDocument} from "../../Database/Feedback";


@Injectable()
export class FeedbackService {
    constructor(
        @InjectModel(Feedback.name) private readonly fbModel: Model<FeedbackDocument>,
    ) {}

    async create(dto: { userId?: string; message: string; contactEmail?: string; category?: string }) {
        return this.fbModel.create({
            userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
            message: dto.message,
            contactEmail: dto.contactEmail ?? null,
            category: dto.category ?? 'general',
        });
    }

    async list(params: { q?: string; category?: string; page?: number; limit?: number }) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

        const q: FilterQuery<FeedbackDocument> = {};
        if (params.category) q.category = params.category;
        if (params.q) q.message = { $regex: params.q, $options: 'i' };

        const [items, total] = await Promise.all([
            this.fbModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.fbModel.countDocuments(q).exec(),
        ]);

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
}
