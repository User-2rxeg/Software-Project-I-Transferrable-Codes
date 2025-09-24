
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


