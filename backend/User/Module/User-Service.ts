import {User, UserDocument, UserRole} from "../Model/User";
import {InjectModel} from "@nestjs/mongoose";
import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {CreateUserDto, UpdateUserDto} from "../Validator/User-Validator";
import {Model, Types} from "mongoose";
import * as bcrypt from 'bcrypt';


type PageOpts = { page?: number; limit?: number };

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    }

    private normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    private toPublic(doc: UserDocument) {
        const o = doc.toObject ? doc.toObject() : doc;
        delete (o as any).passwordHash;
        return o;
    }


    async create(createUserDto: CreateUserDto): Promise<UserDocument> {

        const existingUser = await this.userModel.findOne({email: createUserDto.email});

        if (existingUser) {
            throw new BadRequestException('Email is already registered');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const createdUser = new this.userModel({
            ...createUserDto,
            passwordHash: hashedPassword,
            role: createUserDto.role || UserRole.STUDENT,
            isEmailVerified: false,
            otpCode: null,
            otpExpiresAt: null,
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

        const updatedUser = await this.userModel.findByIdAndUpdate(
            userId,
            {$set: updateData},
            {new: true, runValidators: true}
        ).exec();

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return updatedUser;
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({email: this.normalizeEmail(email)}).exec();
    }


    async findByEmailWithHash(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({email: this.normalizeEmail(email)}).select('+passwordHash').exec();
    }

    async findById(id: string): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException('User not found');
        return this.toPublic(user);
    }

    async findByName(name: string): Promise<any> {
        const user = await this.userModel.findOne({name}).exec();
        if (!user) throw new NotFoundException('User not found');
        return this.toPublic(user);
    }

    async getUserProfile(userId: string) {
        return this.userModel.findById(userId);
    }

    async updateUser(userId: string, updateData: UpdateUserDto): Promise<any> {
        if (updateData.email) updateData.email = this.normalizeEmail(updateData.email);
        // simple: no additional unique-check — optional add check if email changed
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, {new: true}).exec();
        if (!updatedUser) throw new NotFoundException('User not found');
        return this.toPublic(updatedUser);
    }


    async updateUserRole(userId: string, newRole: UserRole): Promise<any> {
        const updatedUser = await this.userModel.findByIdAndUpdate(userId, {role: newRole}, {new: true}).exec();
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
        // include hidden fields
        return this.userModel.findById(id).select('+mfaSecret +mfaBackupCodes').exec();
    }


    private clampLimit(limit: number) {
        if (!Number.isFinite(limit) || limit <= 0) return 20;
        return Math.min(limit, 100); // hard cap to protect DB
    }

    async paginate(filter: Record<string, any>, {page = 1, limit = 20}: PageOpts) {
        const _limit = this.clampLimit(limit);
        const _page = Math.max(1, Number(page) || 1);
        const skip = (_page - 1) * _limit;

        const [items, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-mfaSecret -mfaBackupCodes') // keep secrets out
                .sort({createdAt: -1})
                .skip(skip)
                .limit(_limit)
                .exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);

        return {items, total, page: _page, pages: Math.ceil(total / _limit), limit: _limit};
    }


    async searchUsers(params: {
        q?: string;
        role?: UserRole;
        page?: number;
        limit?: number;
    }) {
        const {q, role, page = 1, limit = 20} = params;
        const filter: any = {};

        if (role) filter.role = role;

        if (q && q.trim()) {
            const term = q.trim();

            filter.$or = [
                {name: {$regex: term, $options: 'i'}},
                {email: {$regex: term, $options: 'i'}},
            ];


            //filter.$text = { $search: term };
        }

        return this.paginate(filter, {page, limit});
    }


}