import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {FilterQuery, Model, Types} from 'mongoose';
import { AuditLog, AuditLogDocument} from "../Model/Audit-Log";
import {CreateAuditLogDto, UpdateAuditLogDto} from "../Validator/Audit-Log.Validator";
import {Logs} from "../Model/Logs";



@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name)
        private readonly auditModel: Model<AuditLogDocument>,
    ) {}


    async log(event: Logs, userId?: string | Types.ObjectId, details?: Record<string, any>) {
        return this.auditModel.create({
            event,
            userId: userId ? new Types.ObjectId(userId) : undefined,
            details: details ?? {},
            timestamp: new Date()
        });
        if(userId){
            if(Types.ObjectId.isValid(String(userId))){
               userId=new Types.ObjectId(String(userId)) as any;
            }
            else{
                throw new BadRequestException('Invalid user id');
            }
        }
    }

    async record(event: Logs, userId?: string, details?: Record<string, any>) {
        return this.log(event, userId, details);
    }


    async create(dto: CreateAuditLogDto) {
        return this.auditModel.create({
            event: dto.event,
            userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
            details: dto.details ?? {},
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


        if (filters?.userId) query.userId = filters.userId as any;
        if (filters?.event) query.event = filters.event;
        if (filters?.from || filters?.to) {
            query.timestamp = {} as any;
            if (filters.from) (query.timestamp as any).$gte = new Date(filters.from);
            if (filters.to) (query.timestamp as any).$lte = new Date(filters.to);
        }


        const [items, total] = await Promise.all([
            this.auditModel
                .find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.auditModel.countDocuments(query).exec(),
        ]);


        return { items, total, page, limit };
    }

    async findByEvent(event: Logs, page = 1, limit = 20, from?: string, to?: string) {
        return this.findAll(page, limit, { event, from, to });
    }

    async findByUser(userId: string, page = 1, limit = 20, from?: string, to?: string) {
        return this.findAll(page, limit, { userId, from, to });
    }

    async findOne(id: string) {
        if(!Types.ObjectId.isValid(id)){
            throw new BadRequestException('Invalid id');
        }
        const doc = await this.auditModel.findById(id).lean().exec();
        // const doc = await this.auditModel.findById(id).exec();
        if (!doc) throw new NotFoundException('Audit log not found');
        return doc;
    }


    async update(id: string, dto: UpdateAuditLogDto) {
        if(!Types.ObjectId.isValid(id)){
            throw new BadRequestException('Invalid id');
        }
        const doc = await this.auditModel.findByIdAndUpdate(id, dto, { new: true }).exec();
       //const doc = await this.auditModel
        // .findByIdAndUpdate(id, dto, { new: true })
        // .lean()
        // .exec();
        if (!doc) throw new NotFoundException('Audit log not found');
        return doc;
    }

    async delete(id: string) {
        //const res = await this.auditModel.findByIdAndDelete(id).lean().exec();
        if(!Types.ObjectId.isValid(id)){
            throw new BadRequestException('Invalid id');
        }
        const res = await this.auditModel.findByIdAndDelete(id).exec()
        if (!res) throw new NotFoundException('Audit log not found');
        return { deleted: true };
    }

    async purgeOlderThan(days: number) {
        if(!Number.isInteger(days) || days < 0){
            throw new BadRequestException('Invalid days || Days must be > 0');
        }
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const { deletedCount } = await this.auditModel.deleteMany({ timestamp: { $lt: cutoff } });
        return { deletedCount };
    }


}




// async log(event: AuditEvent, userId?: string | Types.ObjectId, details?: Record<string, any>) {
//     return this.auditModel.create({
//         event,
//         userId: userId ? new Types.ObjectId(userId) : undefined,
//         details: details ?? {},
//         timestamp: new Date(),
//     });
// }
//
// // alias with stronger typing if you adopt the enum
// async record(event: AuditEvent, userId?: string, details?: Record<string, any>) {
//     return this.log(AuditEvent, userId, details);
// }
//
//
// // async create(dto: CreateAuditLogDto) {
// //     return this.auditModel.create({
// //         ...dto,
// //         timestamp: dto.timestamp ?? new Date(),
// //     });
// // }
//
// async create(payload: {
//     event: AuditEvent | string;
//     userId?: string;
//     details?: Record<string, any>;
// }): Promise<AuditLogDocument> {
//     const doc = new this.auditModel({
//         event: String(payload.event),
//         userId: payload.userId ? new Types.ObjectId(payload.userId) : undefined,
//         details: payload.details ?? {},
//     });
//     return doc.save();
// }

// async create(dto: CreateAuditLogDto) {
//     return this.auditModel.create({
//         ...dto,
//         timestamp: dto.timestamp ?? new Date(),
//     });
// }

// async findAll(
//     page = 1,
//     limit = 20,
//      filters?: { userId?: string; event?: string; from?: string; to?: string },
//  ) {
//     const skip = (page - 1) * limit;
//      const query: FilterQuery<AuditLogDocument> = {};
//
//      if (filters?.userId) query.userId = filters.userId;
//      if (filters?.event) query.event = filters.event;
//      if (filters?.from || filters?.to) {
//         query.timestamp = {};
//          if (filters.from) query.timestamp.$gte = new Date(filters.from);
//         if (filters.to) query.timestamp.$lte = new Date(filters.to);
//      }
//
//      const [items, total] = await Promise.all([
//         this.auditModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
//         this.auditModel.countDocuments(query).exec(),
//      ]);
//
//      return { items, total, page, limit };
//  }



// // --- Generic finder with pagination + optional date-range ---
// private clampLimit(limit?: number) {
//     if (!Number.isFinite(limit as number) || (limit as number) <= 0) return 20;
//     return Math.min(Math.max(1, Math.floor(limit as number)), 200);
// }
//
// private clampPage(page?: number) {
//     const p = Number(page ?? 1);
//     return Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1;
// }
//
// async findAll(
//     page = 1,
//     limit = 20,
//     filters?: { userId?: string; event?: string; from?: string; to?: string },
// ) {
//     const _page = this.clampPage(page);
//     const _limit = this.clampLimit(limit);
//     const skip = (_page - 1) * _limit;
//
//     const query: FilterQuery<AuditLogDocument> = {};
//
//     if (filters?.userId) {
//         if (!Types.ObjectId.isValid(filters.userId)) {
//             throw new BadRequestException('invalid userId');
//         }
//         query.userId = new Types.ObjectId(filters.userId) as any;
//     }
//
//     if (filters?.event) {
//         query.event = filters.event;
//     }
//
//     if (filters?.from || filters?.to) {
//         const range: any = {};
//         if (filters.from) {
//             const d = new Date(filters.from);
//             if (isNaN(d.getTime())) throw new BadRequestException('Invalid "from" date');
//             range.$gte = d;
//         }
//         if (filters.to) {
//             const d = new Date(filters.to);
//             if (isNaN(d.getTime())) throw new BadRequestException('Invalid "to" date');
//             range.$lte = d;
//         }
//         query.timestamp = range;
//     }
//
//     const [items, total] = await Promise.all([
//         this.auditModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(_limit).lean().exec(),
//         this.auditModel.countDocuments(query).exec(),
//     ]);
//
//     return { items, total, page: _page, limit: _limit, pages: Math.ceil(total / _limit) };
// }