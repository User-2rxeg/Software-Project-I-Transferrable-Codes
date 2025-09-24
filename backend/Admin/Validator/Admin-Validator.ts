// admin.Validator.ts
import {IsEnum, IsIn, IsMongoId, IsOptional, IsString} from 'class-validator';
import { UserRole } from '../../User/Model/User';



export class UpdateUserRoleBodyDto {
    @IsEnum(UserRole)
    role!: UserRole;
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







// export enum CourseStatus {
//     ACTIVE = 'active',
//     ARCHIVED = 'archived',
//     DRAFT = 'draft',
// }
//
// export class AnnounceCourseDto {
//     @IsMongoId()
//     courseId!: string;
//
//     @IsString()
//     message!: string;
//
//     @IsOptional()
//     @IsIn(['students', 'instructor', 'all'])
//     to?: 'students' | 'instructor' | 'all';
// }

// export class UpdateCourseStatusBodyDto {
//     @IsEnum(CourseStatus)
//     status!: CourseStatus;
// }