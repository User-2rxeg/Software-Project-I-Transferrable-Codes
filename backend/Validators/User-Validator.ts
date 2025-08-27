import { IsString, IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { UserRole } from '../Database/User';

export class CreateUserDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    password!: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsOptional()
    @IsArray()
    learningPreferences?: string[];

    @IsOptional()
    @IsArray()
    subjectsOfInterest?: string[];

    @IsOptional()
    @IsArray()
    expertise?: string[];

    @IsOptional()
    profileImage?: string;
}

import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDTO extends PartialType(CreateUserDto) {}


export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsArray()
    learningPreferences?: string[];

    @IsOptional()
    @IsArray()
    subjectsOfInterest?: string[];

    @IsOptional()
    @IsArray()
    expertise?: string[];

    @IsOptional()
    @IsString()
    profileImage?: string;
}

// src/DTO/UpdateUserRoleDTO.ts

export class UpdateUserRoleDto {
    @IsString()
    userId!: string;

    @IsEnum(UserRole)
    newRole!: UserRole;
}