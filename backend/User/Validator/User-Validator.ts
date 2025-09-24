import {IsString, IsEmail, IsEnum, IsOptional, IsArray, Length, IsMongoId} from 'class-validator';
import { UserRole } from '../Model/User';


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

    // @IsOptional()
    // @IsString()
    // profileImage?: string;

    // ADD ALL THE FIELDS IN THE NEW PROJECT WITH OPTIONAL


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

    // REMEMBER TO ADD THE REST OF THE FIELDS IN THE NEW PROJECT
}






// Alternative way to create UpdateUserDTO by extending CreateUserDTO
import { PartialType } from '@nestjs/mapped-types';

//export class UpdateUserDTO extends PartialType(CreateUserDto) {}