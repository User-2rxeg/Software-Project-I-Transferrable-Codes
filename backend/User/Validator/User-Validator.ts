import {IsString, IsEmail, IsEnum, IsOptional, IsArray, Length, IsMongoId} from 'class-validator';
import { UserRole } from '../Model/User';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";



export class CreateUserDto {
    @ApiProperty({ example: 'Alice Example', description: 'Full name' })
    @IsString()
    @Length(1, 80)
    name!: string;

    @ApiProperty({ example: 'alice@example.com', description: 'Unique email address' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'P@ssw0rd!', description: 'Plain password (will be hashed server-side)' })
    @IsString()
    @Length(6, 128)
    password!: string;

    @ApiPropertyOptional({ enum: Object.values(UserRole), default: UserRole.STUDENT })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Alice Example' })
    @IsOptional()
    @IsString()
    @Length(1, 80)
    name?: string;

    @ApiPropertyOptional({ example: 'alice@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ enum: Object.values(UserRole) })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png', description: 'Profile image URL' })
    @IsOptional()
    @IsString()
    profileImage?: string;
}

// export class CreateUserDto {
//     @IsString()
//     @Length(1, 80)
//     name!: string;
//
//     @IsEmail()
//     email!: string;
//
//     @IsString()
//     @Length(6, 128)
//     password!: string;
//
//     @IsOptional()
//     @IsEnum(UserRole)
//     role?: UserRole;
//
//     // @IsOptional()
//     // @IsString()
//     // profileImage?: string;
//
//     // ADD ALL THE FIELDS IN THE NEW PROJECT WITH OPTIONAL
//
//
// }
//
//
// export class UpdateUserDto {
//     @IsOptional()
//     @IsString()
//     @Length(1, 80)
//     name?: string;
//
//     @IsOptional()
//     @IsEmail()
//     email?: string;
//
//     @IsOptional()
//     @IsEnum(UserRole)
//     role?: UserRole;
//
//     @IsOptional()
//     @IsString()
//     profileImage?: string;
//
//     // REMEMBER TO ADD THE REST OF THE FIELDS IN THE NEW PROJECT
// }
//
//
// // Alternative way to create UpdateUserDTO by extending CreateUserDTO
//
// import { PartialType } from '@nestjs/mapped-types';
//
// //export class UpdateUserDTO extends PartialType(CreateUserDto) {}