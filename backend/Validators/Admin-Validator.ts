// Admin.DTO.ts
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../Database/User';

export class UpdateUserRoleBodyDto {
    @IsEnum(UserRole)
    role!: UserRole;
}

export class UpdateCourseStatusBodyDto {
    @IsEnum(['active', 'archived', 'draft'] as any)
    status!: 'active' | 'archived' | 'draft';
}

export class AnnounceAllDto {
    @IsString()
    message!: string;
}

export class AnnounceRoleDto {
    @IsEnum(UserRole)
    role!: UserRole;

    @IsString()
    message!: string;
}

export class AnnounceCourseDto {
    @IsMongoId()
    courseId!: string;

    @IsString()
    message!: string;

    @IsOptional()
    @IsEnum(['students', 'instructor', 'all'] as any)
    to?: 'students' | 'instructor' | 'all';
}