import {User, UserDocument, UserRole} from "../Model/User";
import {InjectModel} from "@nestjs/mongoose";
import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {CreateUserDto, UpdateUserDto} from "../Validator/User-Validator";
import {Model, Types} from "mongoose";
import * as bcrypt from 'bcrypt';


type PageOpts = { page?: number; limit?: number };

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private toPublic(doc: UserDocument) {
        const o = doc.toObject ? doc.toObject() : doc;
        delete (o as any).passwordHash;
        delete (o as any).mfaSecret;
        delete (o as any).mfaBackupCodes;
        return o;
    }


    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email });
        if (existingUser) {
            throw new BadRequestException('Email is already registered');
        }

       // const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = new this.userModel({
            ...createUserDto,
            passwordHash: hashedPassword,  // use passwordHash consistently
            role: createUserDto.role || UserRole.STUDENT,
            isEmailVerified: false,
            otpCode: null,
            otpExpiresAt:null,
        });

        return createdUser.save();
    }

    async updateUserInternal(userId: string, updateData: Partial<UserDocument>): Promise<UserDocument> {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid user ID');
        }
        if (updateData.email) {
            updateData.email = this.normalizeEmail(updateData.email);
        }
        // Directly update the document in DB without stripping sensitive fields
        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true } // returns updated document and ensures schema validation
        ).exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
    }


    async findByEmailWithHash(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email: this.normalizeEmail(email) }).select('+passwordHash').exec();
    }

    async findById(id: string): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException('User not found');
        return this.toPublic(user);
    }

    async findByName(name: string): Promise<any> {
        const user = await this.userModel.findOne({ name }).exec();
        if (!user) throw new NotFoundException('User not found');
        return this.toPublic(user);
    }

    async getUserProfile(userId: string) {

        return this.userModel.findById(userId);
    }

    async updateUser(userId: string, updateData: UpdateUserDto): Promise<any> {
        if (updateData.email) updateData.email = this.normalizeEmail(updateData.email);
        // simple: no additional unique-check — optional add check if email changed
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
        if (!updatedUser) throw new NotFoundException('User not found');
        return this.toPublic(updatedUser);
    }


    async updateUserRole(userId: string, newRole: UserRole): Promise<any> {
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, { role: newRole }, { new: true }).exec();
        if (!updatedUser) throw new NotFoundException('User not found');
        return this.toPublic(updatedUser);
    }


    async deleteUser(userId: string): Promise<void> {
        await this.userModel.findByIdAndDelete(userId).exec();
    }

    async getAllUsers(): Promise<UserDocument[]> {
        return this.userModel.find().exec();
    }

    async findByIdSelectSecret(id: string): Promise<UserDocument | null> {
        // explicitly include hidden fields
        return this.userModel.findById(id).select('+mfaSecret +mfaBackupCodes').exec();
    }

    async consumeBackupCode(userId: string, code: string): Promise<boolean> {
        const user = await this.userModel.findById(userId).select('+mfaBackupCodes').exec();
        if (!user?.mfaBackupCodes?.length) return false;
        const idx = user.mfaBackupCodes.indexOf(code);
        if (idx === -1) return false;
        user.mfaBackupCodes.splice(idx, 1);
        await user.save();
        return true;
    }

// SEARCH HELPER METHOD
    private clampLimit(limit: number) {
        if (!Number.isFinite(limit) || limit <= 0) return 20;
        return Math.min(limit, 100); // hard cap to protect DB
    }

    // SEARCH HELPER METHOD
    async paginate(filter: Record<string, any>, { page = 1, limit = 20 }: PageOpts) {
        const _limit = this.clampLimit(limit);
        const _page = Math.max(1, Number(page) || 1);
        const skip = (_page - 1) * _limit;

        const [items, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-mfaSecret -mfaBackupCodes') // keep secrets out
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(_limit)
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);

        return { items, total, page: _page, pages: Math.ceil(total / _limit), limit: _limit };
    }

    //CAN SEARCH USERS BY ANY ROLE, JUST DECLARE ROLE IN PARAMETERS
    async searchUsers(params: {
        q?: string;
        role?: UserRole;
        page?: number;
        limit?: number;
    }) {
        const { q, role, page = 1, limit = 20 } = params;
        const filter: any = {};

        if (role) filter.role = role;

        if (q && q.trim()) {
            const term = q.trim();
            // Regex search on name/email (case-insensitive). Fast for prefix; OK for general use at this scale.
            filter.$or = [
                { name: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } },
            ];

            // If you decide to enable text index, replace block above with:
            //filter.$text = { $search: term };
        }

        return this.paginate(filter, { page, limit });
    }


// Soft delete: mark deletedAt IN THE DATABASE instead of removing document

    async softDelete(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user id');
    }
    const updated = await this.userModel
        .findByIdAndUpdate(userId, { deletedAt: new Date() }, { new: true })
        .exec();
    if (!updated) throw new NotFoundException('User not found');
    // You can return a minimal payload
    return { success: true, id: String(updated._id), deletedAt: updated.deletedAt };
}

// Restore: unset deletedAt
async restore(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user id');
    }
    const updated = await this.userModel
        .findByIdAndUpdate(userId, { deletedAt: null }, { new: true })
        .exec();
    if (!updated) throw new NotFoundException('User not found');
    return { success: true, id: String(updated._id) };
}

// Autocomplete: lightweight search for UI suggestions
async autocomplete(q: string, limit = 10) {
    const term = (q ?? '').trim();
    if (!term) return [];

    // sanitize limit
    const l = Math.min(Math.max(1, Number(limit) || 10), 50);

    // match name or email; exclude soft-deleted users (deletedAt != null)
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape user input
    const users = await this.userModel
        .find({
            deletedAt: null,
            $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
        })
        .select('_id name email role') // only the fields the UI needs
        .limit(l)
        .lean()
        .exec();

    return users;
}

// Unread Messages Counter
    async incrementUnread(userId: string) {
        await this.userModel.findByIdAndUpdate(userId, {
            $inc: { unreadNotificationCount: 1 },
        });
    }

    // Once read should reset,Helper or main function in notifications? check again

    async resetUnread(userId: string) {
        await this.userModel.findByIdAndUpdate(userId, {
            unreadNotificationCount:0,
        });
    }


    // async softDelete(userId: string) {
    //     await this.userModel.findByIdAndUpdate(userId, { deletedAt: new Date() }).exec();
    //     return { success: true };
    // }
    //
    // async restore(userId: string) {
    //     await this.userModel.findByIdAndUpdate(userId, { deletedAt: null }).exec();
    //     return { success: true };
    // }

    // async autocomplete(q: string, limit = 10) {
    //     const term = (q ?? '').trim();
    //     if (!term) return [];
    //     return this.userModel
    //         .find({
    //             $or: [
    //                 { name: { $regex: term, $options: 'i' } },
    //                 { email: { $regex: term, $options: 'i' } },
    //             ],
    //             deletedAt: null,
    //         })
    //         .select('_id name email role')
    //         .limit(Math.min(20, Math.max(1, limit)))
    //         .lean()
    //         .exec();
    // }
}



// src/user/user.service.ts
//import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
//import { InjectModel } from '@nestjs/mongoose';
//import {Model, Types} from 'mongoose';
//import {User, UserDocument, UserRole} from '../Model/User';
//import {CreateUserDto, UpdateUserDto} from "../Validators/User-Validator";
//import * as bcrypt from 'bcrypt';
// type PageOpts = { page?: number; limit?: number };
//
// @Injectable()
// export class UserService {
//     constructor(
//         @InjectModel(User.name) private userModel: Model<UserDocument>,
//     ) {}
//
//
//     async create(createUserDto: CreateUserDto): Promise<UserDocument> {
//         const existingUser = await this.userModel.findOne({ email: createUserDto.email });
//         if (existingUser) {
//             throw new BadRequestException('Email is already registered');
//         }
//
//         const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
//         const createdUser = new this.userModel({
//             ...createUserDto,
//             password: hashedPassword,
//             role: createUserDto.role || 'student',
//             isEmailVerified:false,
//             otpCode:null,
//             otpExpiresAt:null,// default role
//         });
//
//         return createdUser.save();
//     }
//
//     async findByEmail(email: string): Promise<UserDocument | null> {
//         return this.userModel.findOne({ email }).exec(); // <-- .lean() is important
//     }
//
//
//     async findById(id: string): Promise<UserDocument | null> {
//         return this.userModel.findById(id).exec();
//     }
//
//
//     async updateUser(userId: string, updateData: Partial<User>): Promise<UserDocument> {
//         const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
//         if (!updatedUser) throw new NotFoundException('User not found');
//         return updatedUser;
//     }
//
//
//
//     async updateUserRole(userId: string, newRole: UserRole): Promise<UserDocument> {
//         const updatedUser = await this.userModel.findByIdAndUpdate(
//             userId,
//             { role: newRole },
//             { new: true }
//         ).exec();
//
//         if (!updatedUser) {
//             throw new NotFoundException('User not found');
//         }
//
//         return updatedUser;
//     }
//
//
//     async deleteUser(userId: string): Promise<void> {
//         await this.userModel.findByIdAndDelete(userId).exec();
//     }
//
//     async getAllUsers(): Promise<UserDocument[]> {
//         return this.userModel.find().exec();
//     }
//
//     async findByIdSelectSecret(id: string): Promise<UserDocument | null> {
//         // explicitly include hidden fields
//         return this.userModel.findById(id).select('+mfaSecret +mfaBackupCodes').exec();
//     }
//
//     async consumeBackupCode(userId: string, code: string): Promise<boolean> {
//         const user = await this.userModel.findById(userId).select('+mfaBackupCodes').exec();
//         if (!user?.mfaBackupCodes?.length) return false;
//         const idx = user.mfaBackupCodes.indexOf(code);
//         if (idx === -1) return false;
//         user.mfaBackupCodes.splice(idx, 1);
//         await user.save();
//         return true;
//     }
//
//
//     private clampLimit(limit: number) {
//         if (!Number.isFinite(limit) || limit <= 0) return 20;
//         return Math.min(limit, 100); // hard cap to protect DB
//     }
//
//     async paginate(filter: Record<string, any>, { page = 1, limit = 20 }: PageOpts) {
//         const _limit = this.clampLimit(limit);
//         const _page = Math.max(1, Number(page) || 1);
//         const skip = (_page - 1) * _limit;
//
//         const [items, total] = await Promise.all([
//             this.userModel
//                 .find(filter)
//                 .select('-mfaSecret -mfaBackupCodes') // keep secrets out
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(_limit)
//                 .exec(),
//             this.userModel.countDocuments(filter).exec(),
//         ]);
//
//         return { items, total, page: _page, pages: Math.ceil(total / _limit), limit: _limit };
//     }
//
//     async searchUsers(params: {
//         q?: string;
//         role?: UserRole;
//         page?: number;
//         limit?: number;
//     }) {
//         const { q, role, page = 1, limit = 20 } = params;
//         const filter: any = {};
//
//         if (role) filter.role = role;
//
//         if (q && q.trim()) {
//             const term = q.trim();
//             // Regex search on name/email (case-insensitive). Fast for prefix; OK for general use at this scale.
//             filter.$or = [
//                 { name: { $regex: term, $options: 'i' } },
//                 { email: { $regex: term, $options: 'i' } },
//             ];
//
//             // If you decide to enable text index, replace block above with:
//             //filter.$text = { $search: term };
//         }
//
//         return this.paginate(filter, { page, limit });
//     }
// }
