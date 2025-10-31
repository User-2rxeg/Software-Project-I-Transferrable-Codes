import {
    Controller,
    Post,
    Body,
    Get,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    InternalServerErrorException,
    Param,
} from '@nestjs/common';
import { Public } from '../Decorators/Public-Decorator';
import { AuthService } from './Authentication-Service';
import { CreateUserDto } from '../../User/Validator/User-Validator';

import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {AuthTokensDto, MfaSetupDto, SimpleMessageDto} from "../DTO's/Responses";
import {JwtAuthGuard} from "../Guards/Authentication-Guard";
import {JwtPayload} from "../Interfaces/JWT-Payload";
import {CurrentUser} from "../Decorators/Current-User";
import {TempJwtGuard} from "../Guards/MFA-Guard";
import {MfaActivateDto, VerifyLoginDto} from "../DTO's/MFA";
import {ForgotPasswordDto} from "../DTO's/OTP";
import {LoginDto} from "../DTO's/Login";


@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiCreatedResponse({ description: 'User registered (may require email verification)' })
    async register(@Body() dto: CreateUserDto) {
        try {
            return await this.auth.register(dto);
        } catch (e) {
            throw new InternalServerErrorException('Something went wrong during registration.');
        }
    }

    @Public()
    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify registration / email OTP' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, otp: { type: 'string' } } } })
    @ApiOkResponse({ description: 'OTP verified', type: SimpleMessageDto })
    async verifyOTP(@Body('email') email: string, @Body('otp') otpCode: string) {
        const res = await this.auth.verifyOTP(email, otpCode);
        return { message: 'Email verified successfully', ...res };
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({ description: 'Login successful — returns tokens or MFA challenge', type: AuthTokensDto })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto) {
        return this.auth.login(dto.email, dto.password);
    }



    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    @ApiOperation({ summary: 'Logout (invalidate current access token)' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Logout result', type: SimpleMessageDto })
    async logout(@Req() req: any) {
        const authHeader: string | undefined = req.headers?.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        if (!token) return { message: 'no-op' };
        return this.auth.logout(token);
    }

    // OTP flows
    @Public()
    @Post('send-otp')
    @ApiOperation({ summary: 'Send OTP to email (signup / forgot flows)' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } })
    @ApiOkResponse({ description: 'OTP sent', type: SimpleMessageDto })
    async sendOTP(@Body('email') email: string) {
        await this.auth.sendOTP(email);
        return { message: 'OTP sent to email' };
    }

    @Public()
    @Post('resend-otp')
    @ApiOperation({ summary: 'Resend previously generated OTP' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } })
    @ApiOkResponse({ description: 'OTP resent', type: SimpleMessageDto })
    async resendOTP(@Body('email') email: string) {
        await this.auth.resendOTP(email);
        return { message: 'OTP resent successfully' };
    }

    @Public()
    @Get('otp-status/:email')
    @ApiOperation({ summary: 'Check OTP status (exists/expired) for an email' })
    @ApiOkResponse({ description: 'OTP status object' })
    async otpStatus(@Param('email') email: string) {
        return this.auth.checkOTPStatus(email);
    }

    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request forgot-password OTP' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiOkResponse({ description: 'OTP sent', type: SimpleMessageDto })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        await this.auth.forgotPassword(dto.email);
        return { message: 'OTP sent to email' };
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using OTP' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', format: 'email' },
                otpCode: { type: 'string' },
                newPassword: { type: 'string' },
            },
            required: ['email', 'otpCode', 'newPassword'],
        },
    })
    @ApiOkResponse({ description: 'Password reset successful', type: SimpleMessageDto })
    async resetPassword(@Body('email') email: string, @Body('otpCode') otpCode: string, @Body('newPassword') newPassword: string) {
        await this.auth.resetPassword(email, otpCode, newPassword);
        return { message: 'Password reset successful' };
    }

    // MFA flows
    @UseGuards(JwtAuthGuard)
    @Post('mfa/setup')
    @ApiOperation({ summary: 'Initiate MFA setup (returns otpauth URL & secret to display to user)' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'MFA setup info', type: MfaSetupDto })
    async mfaSetup(@CurrentUser() user: JwtPayload) {
        return this.auth.enableMfa(user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/activate')
    @ApiOperation({ summary: 'Activate MFA (verify the TOTP token provided by user)' })
    @ApiBearerAuth('access-token')
    @ApiBody({ type: MfaActivateDto })
    @ApiOkResponse({ description: 'MFA activated', type: SimpleMessageDto })
    async mfaActivate(@CurrentUser() user: JwtPayload, @Body() body: MfaActivateDto) {
        return this.auth.verifyMfaSetup(user.sub, body.token);
    }

    @UseGuards(TempJwtGuard)
    @Post('mfa/verify-login')
    @ApiOperation({ summary: 'Verify MFA during login (temp session)' })
    @ApiBearerAuth('access-token')
    @ApiBody({ type: VerifyLoginDto })
    @ApiOkResponse({ description: 'Login success — tokens returned', type: AuthTokensDto })
    async mfaVerifyLogin(@CurrentUser() user: JwtPayload, @Body() body: VerifyLoginDto) {
        return this.auth.verifyLoginWithMfa(user.sub, body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mfa/disable')
    @ApiOperation({ summary: 'Disable MFA for current user' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'MFA disabled', type: SimpleMessageDto })
    async disableMfa(@CurrentUser() user: JwtPayload) {
        return this.auth.disableMfa(user.sub);
    }
}
