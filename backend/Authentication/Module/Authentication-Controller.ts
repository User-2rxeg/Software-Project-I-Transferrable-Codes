import {
    Controller,
    Post,
    Body,
    Get,
    HttpCode,
    HttpStatus,
    Request,
    UseGuards, InternalServerErrorException, Param,
} from '@nestjs/common';
import {Public} from "../Decorators/Public-Decorator";
import { AuthService } from './Authentication-Service';
import {RegisterDto} from "../Validators/Register-Validator";
import { LoginDto } from '../Validators/Login-Validator';
import {JwtAuthGuard} from "../Guards/AuthGuard";
import {CurrentUser} from "../Decorators/Current-User";
import {JwtPayload} from "../Interfaces/JWT-Payload.Interface";
import {MfaActivateDto, VerifyLoginDto} from "../Validators/MFA-Validator";
import {TempJwtGuard} from "../Guards/MFA-JWT.Guard";


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            return await this.authService.register(registerDto);
        } catch (error) {
            console.error('register error:', error);
            throw new InternalServerErrorException('Something went wrong during registration.');
        }
    }
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }

    //@UseGuards(JwtAuthGuard)
    //@HttpCode(HttpStatus.OK)
    //@Post('logout')
    //async logout(@Request() req: ExpressRequest) {
        //const authHeader = req.headers.authorization;
        //const token = authHeader?.split(' ')[1];

        //if (token) {
          //  await this.authService.logout(token);
        //}

      //  return { message: 'logout successful' };
    //}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@CurrentUser() user: JwtPayload) {
        const fullUser = await this.authService.getUserProfile(user.sub);
        return fullUser;
    }
    @Public()
    @Post('send-otp')
    async sendOTP(@Body('email') email: string) {
        await this.authService.sendOTP(email);
        return { message: 'OTP sent to email' };
    }
    @Public()
    @Post('verify-otp')
    async verifyOTP(@Body('email') email: string, @Body('otp') otpCode: string) {
        const auth = await this.authService.verifyOTP(email, otpCode);
        return {
            message: 'Email verified successfully',
            ...auth
        };
    }
    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        await this.authService.forgotPassword(email);
        return { message: 'OTP sent to email' };
    }
    @Public()
    @Post('reset-password')
    async resetPassword(
        @Body('email') email: string,
        @Body('otpCode') otpCode: string,
        @Body('newPassword') newPassword: string
    ) {
        await this.authService.resetPassword(email, otpCode, newPassword);
        return { message: 'Password reset successful' };
    }
    @Public()
    @Post('resend-otp')
    async resendOTP(@Body('email') email: string) {
        await this.authService.resendOTP(email);
        return { message: 'OTP resent successfully' };
    }
    @Public()
    @Get('otp-status/:email')
    async otpStatus(@Param('email') email: string) {
        const status = await this.authService.checkOTPStatus(email);
        return status;
    }



    @Post('mfa/setup')
    @UseGuards(JwtAuthGuard)
    async mfaSetup(@CurrentUser() user: JwtPayload) {
        return this.authService.enableMfa(user.sub);
    }

    @Post('mfa/activate')
    @UseGuards(JwtAuthGuard)
    async mfaActivate(@CurrentUser() user: JwtPayload, @Body() body: MfaActivateDto) {
        return this.authService.verifyMfaSetup(user.sub, body.token);
    }


    @Post('mfa/verify-login')
    @UseGuards(TempJwtGuard)
    async mfaVerifyLogin(@CurrentUser() user: JwtPayload, @Body() body: VerifyLoginDto) {
        return this.authService.verifyLoginWithMfa(user.sub, body);
    }

    //@UseGuards(JwtAuthGuard)
    //@Get('mfa/status')
    //async mfaStatus(@CurrentUser() user: JwtPayload) {
    //   return this.authService.getMfaStatus(user.sub);
    // }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/disable')
    async disableMfa(@CurrentUser() user: JwtPayload) {
        return this.authService.disableMfa(user.sub);
    }

}
