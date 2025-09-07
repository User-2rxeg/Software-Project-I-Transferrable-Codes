import { IsString, IsEmail, IsOptional, IsEnum, IsArray, MinLength } from 'class-validator';
import { UserRole } from '../../Database/User';

export class RegisterDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsEnum(UserRole)
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















//
//
// import {IsString, IsEmail, IsOptional, IsEnum, IsArray, MinLength} from 'class-validator';
// import { UserRole } from '../../Database/User';
//
// export class RegisterDto {
//     @IsString()
//     name!: string;
//
//     @IsEmail()
//     email!: string;
//
//     @IsString()
//     password!: string;
//
//     @IsOptional()
//     @IsEnum(UserRole)
//     role?: UserRole;
//
// //     @IsOptional()
// //     @IsArray()
// //     learningPreferences?: string[];
// //
// //     @IsOptional()
// //     @IsArray()
// //     subjectsOfInterest?: string[];
// //
// //     @IsOptional()
// //     @IsArray()
// //     expertise?: string[];
// //
// //     @IsOptional()
// //     profileImage?: string;
// // }
//
//
//
// // export class RegisterDto {
// //     @IsString()
// //     name!: string;
// //
// //     @IsEmail()
// //     email!: string;
// //
// //     @IsString()
// //     @MinLength(6)
// //     password!: string;
// //
// //     @IsOptional()
// //     @IsEnum(UserRole)
// //     role?: UserRole;
// // }