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
        private readonly mail: MailService, // inject your mail service
    ) {}

    async create(dto: { userId?: string; message: string; contactEmail?: string; category?: string }) {
        // Build doc payload
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

        // send admin email in background but avoid unhandled exceptions
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
                // if your MailService defines sendFeedbackEmail use it, otherwise skip
                if (typeof (this.mail as any).sendFeedbackEmail === 'function') {
                    await (this.mail as any).sendFeedbackEmail(adminEmail, subject, html);
                } else if (typeof (this.mail as any).sendVerificationEmail === 'function') {
                    // fallback: reuse verification template (not ideal, but safe)
                    await (this.mail as any).sendVerificationEmail(adminEmail, `Feedback from ${dto.contactEmail ?? 'anonymous'}`);
                }
            } catch (err) {
                // don't crash the request — log for visibility
                // replace console.log with your logger if available
                console.error('Failed to send feedback email', (err as any)?.message ?? err);
            }
        })();

        return created;
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




























// import {Feedback, FeedbackDocument} from "../Model/Feedback";
//
//
// @Injectable()
// export class FeedbackService {
//     constructor(
//         @InjectModel(Feedback.name) private readonly fbModel: Model<FeedbackDocument>,
//     ) {}
//
//     async create(dto: { userId?: string; message: string; contactEmail?: string; category?: string }) {
//         return this.fbModel.create({
//             userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
//             message: dto.message,
//             contactEmail: dto.contactEmail ?? null,
//             category: dto.category ?? 'general',
//         });
//     }
//
//     async list(params: { q?: string; category?: string; page?: number; limit?: number }) {
//         const page = Math.max(1, Number(params.page) || 1);
//         const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
//         const skip = (page - 1) * limit;
//
//         const q: FilterQuery<FeedbackDocument> = {};
//         if (params.category) q.category = params.category;
//         if (params.q) q.message = { $regex: params.q, $options: 'i' };
//
//         const [items, total] = await Promise.all([
//             this.fbModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
//             this.fbModel.countDocuments(q).exec(),
//         ]);
//
//         return { items, total, page, limit, pages: Math.ceil(total / limit) };
//     }
// }
