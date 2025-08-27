// src/user/user.service.ts
import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {User, UserDocument, UserRole} from '../Database/User';
import {CreateUserDto} from "../Validators/User-Validator";
import * as bcrypt from 'bcrypt';
type PageOpts = { page?: number; limit?: number };

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}


    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email });
        if (existingUser) {
            throw new BadRequestException('Email is already registered');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            role: createUserDto.role || 'student',
            isEmailVerified:false,
            otpCode:null,
            otpExpiresAt:null,// default role
        });

        return createdUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec(); // <-- .lean() is important
    }


    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }


    async updateUser(userId: string, updateData: Partial<User>): Promise<UserDocument> {
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
        if (!updatedUser) throw new NotFoundException('User not found');
        return updatedUser;
    }



    async updateUserRole(userId: string, newRole: UserRole): Promise<UserDocument> {
        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true }
        ).exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        return updatedUser;
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


    private clampLimit(limit: number) {
        if (!Number.isFinite(limit) || limit <= 0) return 20;
        return Math.min(limit, 100); // hard cap to protect DB
    }

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
}
