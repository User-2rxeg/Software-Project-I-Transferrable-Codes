import {IsString, IsEmail, IsEnum, IsOptional, IsArray, Length, IsMongoId} from 'class-validator';
import { UserRole } from '../Database/User';


export class CreateUserDto {
    @IsString()
    @Length(1, 80)
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 128)
    password!: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    profileImage?: string;

    // Optional arrays can be added later if you re-enable them in the schema:
    // learningPreferences?: string[];
    // subjectsOfInterest?: string[];
    // expertise?: string[];
}





export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @Length(1, 80)
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    profileImage?: string;

    // REMEMBER THE REST OF THE FIELDS
}



export class UpdateUserRoleDto {
    @IsMongoId()
    userId!: string;

    @IsEnum(UserRole)
    newRole!: UserRole;
}


// export class CreateUserDto {
//     @IsString()
//     name!: string;
//
//     @IsEmail()
//     email!: string;
//
//     @IsString()
//     password!: string;
//
//     @IsEnum(UserRole)
//     @IsOptional()
//     role?: UserRole;
//
//     @IsOptional()
//     @IsArray()
//     learningPreferences?: string[];
//
//     @IsOptional()
//     @IsArray()
//     subjectsOfInterest?: string[];
//
//     @IsOptional()
//     @IsArray()
//     expertise?: string[];
//
//     @IsOptional()
//     profileImage?: string;
// }


// src/DTO/UpdateUserRoleDTO.ts

// export class UpdateUserRoleDto {
//     @IsString()
//     userId!: string;
//
//     @IsEnum(UserRole)
//     newRole!: UserRole;
// }


import { PartialType } from '@nestjs/mapped-types';

//export class UpdateUserDTO extends PartialType(CreateUserDto) {}