
import {IsEnum, IsIn, IsMongoId, IsOptional, IsString} from 'class-validator';
import { UserRole } from '../../User/Model/User';
import {ApiProperty} from "@nestjs/swagger";


export class UpdateUserRoleBodyDto {
    @ApiProperty({ enum: Object.values(UserRole), description: 'New role to assign' })
    @IsEnum(UserRole)
    role!: UserRole;
}

export class AnnounceAllDto {
    @ApiProperty({ example: 'Platform maintenance tonight 02:00-03:00 UTC' })
    @IsString()
    message!: string;
}

export class AnnounceRoleDto {
    @ApiProperty({ enum: Object.values(UserRole) })
    @IsEnum(UserRole)
    role!: UserRole;

    @ApiProperty({ example: 'Important announcement for instructors' })
    @IsString()
    message!: string;
}



