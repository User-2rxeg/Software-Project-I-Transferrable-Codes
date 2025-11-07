// src/Feedback/Feedback-Service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from '../Model/Feedback';
import {MailService} from "../../../Authentication/Email/Email-Service";


@Injectable()
export class FeedbackService {
    constructor(
        @InjectModel(Feedback.name) private readonly fbModel: Model<FeedbackDocument>,
        private readonly mail: MailService,
    ) {}

    async create(dto: { userId?: string; message: string; contactEmail?: string; category?: string }) {

        const payload: Partial<Feedback> = {
            message: dto.message,
            contactEmail: dto.contactEmail ?? null,
            category: dto.category ?? 'general',
        };
        if (dto.userId) {
            // validate ObjectId
            if (!Types.ObjectId.isValid(dto.userId)) {
                throw new InternalServerErrorException('Invalid user id');
            }
            payload.userId = new Types.ObjectId(dto.userId);
        }

        // persist feedback
        const created = await this.fbModel.create(payload);

        (async () => {
            try {
                const adminEmail = process.env.FEEDBACK_TO_EMAIL;
                if (!adminEmail) return;

                const subject = `New Feedback (${payload.category})`;
                const html = `
          <p><strong>Message:</strong></p>
          <p>${(payload.message ?? '').replace(/\n/g, '<br/>')}</p>
          <hr/>
          <p><strong>From:</strong> ${dto.contactEmail ?? 'anonymous'}</p>
          <p><strong>UserId:</strong> ${dto.userId ?? 'anonymous'}</p>
          <p><strong>Category:</strong> ${payload.category}</p>
        `;

                if (typeof (this.mail as any).sendFeedbackEmail === 'function') {
                    await (this.mail as any).sendFeedbackEmail(adminEmail, subject, html);
                } else if (typeof (this.mail as any).sendVerificationEmail === 'function') {

                    await (this.mail as any).sendVerificationEmail(adminEmail, `Feedback from ${dto.contactEmail ?? 'anonymous'}`);
                }
            } catch (err) {

                console.error('Failed to send feedback email', (err as any)?.message ?? err);
            }
        })();

        return created;
    }

    async createFeedback(userId: string, dto: {
        title: string;
        description: string;
        category?: string;
        priority?: string;
        status?: string;
    }) {
        const payload: Partial<Feedback> = {
            message: `${dto.title}\n\n${dto.description}`,
            category: dto.category ?? 'GENERAL',
        };

        if (userId && Types.ObjectId.isValid(userId)) {
            payload.userId = new Types.ObjectId(userId);
        }

        return this.fbModel.create(payload);
    }

    async list(params: { q?: string; category?: string; page?: number; limit?: number }) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

        const q: FilterQuery<FeedbackDocument> = {};
        if (params.category) q.category = params.category;
        if (params.q) q.message = { $regex: params.q, $options: 'i' };

        const [items, total] = await Promise.all([
            this.fbModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email').lean().exec(),
            this.fbModel.countDocuments(q).exec(),
        ]);

        // Transform items to match frontend expectations
        const transformedItems = items.map(item => {
            const lines = item.message.split('\n\n');
            return {
                ...item,
                title: lines[0] || 'Feedback',
                description: lines.slice(1).join('\n\n') || item.message,
                status: 'PENDING',
                priority: 'MEDIUM',
            };
        });

        return { items: transformedItems, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new InternalServerErrorException('Invalid feedback ID');
        }

        const feedback = await this.fbModel.findById(id).populate('userId', 'name email').exec();
        if (!feedback) {
            throw new InternalServerErrorException('Feedback not found');
        }

        const lines = feedback.message.split('\n\n');
        return {
            ...feedback.toObject(),
            title: lines[0] || 'Feedback',
            description: lines.slice(1).join('\n\n') || feedback.message,
            status: 'PENDING',
            priority: 'MEDIUM',
        };
    }

    async update(id: string, dto: {
        title?: string;
        description?: string;
        category?: string;
        status?: string;
        priority?: string;
    }) {
        if (!Types.ObjectId.isValid(id)) {
            throw new InternalServerErrorException('Invalid feedback ID');
        }

        const updateData: any = {};
        if (dto.title && dto.description) {
            updateData.message = `${dto.title}\n\n${dto.description}`;
        }
        if (dto.category) {
            updateData.category = dto.category;
        }

        const updated = await this.fbModel.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'name email').exec();
        if (!updated) {
            throw new InternalServerErrorException('Feedback not found');
        }

        const lines = updated.message.split('\n\n');
        return {
            ...updated.toObject(),
            title: lines[0] || 'Feedback',
            description: lines.slice(1).join('\n\n') || updated.message,
            status: 'PENDING',
            priority: 'MEDIUM',
        };
    }

    async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new InternalServerErrorException('Invalid feedback ID');
        }

        const deleted = await this.fbModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new InternalServerErrorException('Feedback not found');
        }

        return { success: true };
    }
}





