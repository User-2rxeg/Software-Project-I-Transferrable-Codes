import {IsEmail, IsString} from 'class-validator';

export class SendOtpDto {
    @IsEmail()
    email!: string;
}

export class VerifyOtpDto {
    @IsEmail()
    email!: string;

    @IsString()
    otpCode!: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email!: string;
}