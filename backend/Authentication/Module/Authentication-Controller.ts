import {
    Controller,
    Post,
    Body,
    Get,
    HttpCode,
    HttpStatus,
    Req,
    Res,
    UseGuards,
    InternalServerErrorException,
    Param,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../Decorators/Public-Decorator';
import { AuthService } from './Authentication-Service';
import { CreateUserDto } from '../../User/Validator/User-Validator';

import {
    ApiBearerAuth,
    ApiTags,
} from '@nestjs/swagger';

import {JwtAuthGuard} from "../Guards/Authentication-Guard";
import {ForgotPasswordDto} from "../DTO's/OTP";
import {LoginDto} from "../DTO's/Login";


@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Public()
    @Post('register')
    async register(@Body() dto: CreateUserDto) {
        try {
            return await this.auth.register(dto);
        } catch (e) {
            throw new InternalServerErrorException('Something went wrong during registration.');
        }
    }


    @Public()
    @Get('otp-status/:email')
    async otpStatus(@Param('email') email: string) {
        return this.auth.checkOTPStatus(email);
    }

    @Public()
    @Post('resend-otp')
    async resendOTP(@Body('email') email: string) {
        await this.auth.resendOTP(email);
        return { message: 'OTP resent successfully' };
    }

    @Public()
    @Post('verify-otp')
    async verifyOTP(@Body('email') email: string, @Body('otp') otpCode: string) {
        const res = await this.auth.verifyOTP(email, otpCode);
        return { message: 'Email verified successfully', ...res };
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.auth.login(dto.email, dto.password);
        const cookie = await this.auth.getCookieWithJwtToken(result.access_token);
        res.setHeader('Set-Cookie', cookie);
        return { message: 'Login successful', user: result.user };
    }



    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        const token = req.cookies?.access_token;
        if (token) {
            await this.auth.logout(token);
        }
        const cookie = await this.auth.getCookieForLogout();
        res.setHeader('Set-Cookie', cookie);
        return { message: 'Logout successful' };
    }



    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        await this.auth.forgotPassword(dto.email);
        return { message: 'OTP sent to email' };
    }

    @Public()
    @Post('reset-password')
    async resetPassword(@Body('email') email: string, @Body('otpCode') otpCode: string, @Body('newPassword') newPassword: string) {
        await this.auth.resetPassword(email, otpCode, newPassword);
        return { message: 'Password reset successful' };
    }


}
