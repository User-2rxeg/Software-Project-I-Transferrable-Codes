
import {
    Injectable,
    UnauthorizedException,
    ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

import {from} from "rxjs";
import {UserService} from "../../User/User-Service";
import {BlacklistedToken, BlacklistedTokenDocument} from "../../Database/Token";
import {AuditLogService} from "../../Audit-Log/Audit-Log.Service";
import {User, UserDocument} from "../../Database/User";

config();

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectModel(BlacklistedToken.name) private readonly blacklistModel: Model<BlacklistedTokenDocument>,
        private readonly audit:AuditLogService,
      //  private readonly mailService: MailService,
    ) {}



    //async register(registerDto: any): Promise<any> {
    //  const existingUser = await this.userService.findByEmail(registerDto.email);
    //if (existingUser) {
    //    throw new UnauthorizedException('Email already in use');
    //}

    // Reuse the UserService to create the user
    //return this.userService.create(registerDto);
    //}
// AuthService.register
    // AuthService.ts
    async register(registerDto: any) {
        // 1) email must be unique
        const existing = await this.userService.findByEmail(registerDto.email);
        if (existing) {
            throw new UnauthorizedException('Email already in use');
        }

        // 2) create user with isEmailVerified=false (and let UserService hash password)
        const newUser = await this.userService.create({
            ...registerDto,
            isEmailVerified: false,
            otpCode: null,
            otpExpiresAt: null,
        });

        // 3) issue OTP (valid for 10 minutes) and persist on the user
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.userService.updateUser(String(newUser._id), { otpCode, otpExpiresAt });

        // 4) send email (using your env-configured SMTP)
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true', // true:465, false:587
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });

            const fromName = process.env.EMAIL_FROM_NAME ?? 'E-Learning Platform';
            const smtpUser = process.env.SMTP_USER ?? '';
            const from = `"${fromName}" <${smtpUser}>`;

            await transporter.sendMail({
                from,
                to: newUser.email,
                subject: 'Verify your email (OTP)',
                text: `Your OTP Code is: ${otpCode}. It expires in 10 minutes.`,
            });
        } catch (e) {
            // Don’t fail registration if email sending hiccups; user can /auth/resend-otp
            await this.audit.log('REGISTER_EMAIL_SEND_FAIL', String(newUser._id), {
                email: newUser.email,
                reason: (e as Error)?.message,
            });
        }

        // 5) audit & respond
        await this.audit.log('REGISTER', String(newUser._id), { email: newUser.email });
        return {
            message: 'Registered. Please verify your email via the OTP we sent.',
            userId: String(newUser._id),
        };
    }

    async validateUser(email: string, plainPassword: string): Promise<any> {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const passwordMatches = await bcrypt.compare(plainPassword, user.password);
        if (!passwordMatches){
            await this.audit.log('LOGIN FAILURE', String(user._id), {email, reason: 'BAD PASSWORD'});
            throw new UnauthorizedException('Invalid credentials');

        }
        const { password, ...result } = (user as UserDocument).toObject();
        return result;
    }

    //async login(email: string, plainPassword: string): Promise<{ access_token: string; refresh_token: string; user: any }> {
    //  const user = await this.validateUser(email, plainPassword);

    //const payload = {
    //  sub: user._id.toString(),
    //email: user.email,
    //role: user.role,
    //};

    //const access_token = await this.jwtService.signAsync(payload, {
    //  expiresIn: '1h',
    //});

    //const refresh_token = await this.jwtService.signAsync(payload, {
    //  expiresIn: '7d',
    //});
//await this.audit.log('LOGIN SUCCESSFUL', user._id.toString(), {email: user.email, role: user.role});
    //return {
    //  access_token,
    //refresh_token,
    //user,
    //};
    //}

    // AuthService.login
    async login(email: string, plainPassword: string) {
        const user = await this.validateUser(email, plainPassword);

        if (!user.isEmailVerified) {
            // optionally send a fresh OTP here
            throw new UnauthorizedException('Email not verified. Please verify your email first.');
        }

        if (user.mfaEnabled) {
            const tempToken = await this.issueTempMfaToken(user);
            return { mfaRequired: true, tempToken };
        }

        const payload = { sub: user._id.toString(), email: user.email, role: user.role };
        const access_token  = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
        const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
        await this.audit.log('LOGIN SUCCESSFUL', user._id.toString(), { email: user.email, role: user.role });
        return { access_token, refresh_token, user };
    }

    async logout(token: string): Promise<void> {
        const decoded = this.jwtService.decode(token);

        if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
            throw new ForbiddenException('Invalid token');
        }

        await this.blacklistModel.create({
            token,
            expiresAt: new Date((decoded.exp as number) * 1000),
        });
    }

    async refreshToken(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
        try {
            const decoded = await this.jwtService.verifyAsync(refresh_token);
            const payload = {
                sub: decoded.sub,
                email: decoded.email,
                role: decoded.role,
            };

            const access_token = await this.jwtService.signAsync(payload, {
                expiresIn: '1h',
            });

            const new_refresh_token = await this.jwtService.signAsync(payload, {
                expiresIn: '7d',
            });

            return {
                access_token,
                refresh_token: new_refresh_token,
            };
        } catch (err) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        const blacklisted = await this.blacklistModel.findOne({ token }).exec();
        return !!blacklisted;
    }


    async getUserProfile(userId: string): Promise<User | null> {
        return this.userService.findById(userId);
    }


    async verifyOTP(email: string, otpCode: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if (user.otpCode !== otpCode || new Date() > user.otpExpiresAt!) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        await this.userService.updateUser(user._id.toString(), {
            isEmailVerified: true,
            otpCode: null,
            otpExpiresAt: null
        });

        // Generate and return a token
        const payload = { sub: user._id.toString(), email: user.email, role: user.role };
        const token = this.jwtService.sign(payload);

        return { token, user: { id: user._id, email: user.email, role: user.role } };
    }




    private async generateAndSendOTP(
        email: string,
        purpose: 'verification' | 'password-reset' | 'login',
        rateLimit = true
    ): Promise<void> {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');


        let lastOtpTime = user.otpExpiresAt || null;
        if (rateLimit && lastOtpTime && (new Date().getTime() - lastOtpTime.getTime()) < 2 * 60 * 1000) {
            throw new BadRequestException('Please wait before requesting a new OTP');
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store OTP in standard fields
        await this.userService.updateUser(user._id.toString(), {
            otpCode,
            otpExpiresAt
        });

        // Email content based on purpose
        let subject = 'Your OTP Code';
        let text = `Your OTP Code is: ${otpCode}`;
        if (purpose === 'verification') {
            subject = 'Verify Your Email Address';
            text = `Your email verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.`;
        } else if (purpose === 'password-reset') {
            subject = 'Reset Your Password';
            text = `Your password reset code is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request a password reset, please ignore this email.`;
        } else if (purpose === 'login') {
            subject = 'Login Verification Code';
            text = `Your login verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.`;
        }

        try {
            // Use real Gmail transporter instead of Ethereal
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
                to: email,
                subject,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${subject}</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #3e64ff; font-size: 36px; text-align: center; letter-spacing: 8px;">
                            ${otpCode}
                        </h1>
                    </div>
                    <p style="color: #666;">${text}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${email}`);

        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
            throw new BadRequestException('Failed to send email. Please try again.');
        }
    }



    async sendOTP(email: string): Promise<void> {
        await this.generateAndSendOTP(email, 'verification', false);
    }

    async resendOTP(email: string): Promise<void> {
        await this.generateAndSendOTP(email, 'verification', true);
    }

    async forgotPassword(email: string): Promise<void> {
        await this.generateAndSendOTP(email, 'password-reset', false);
    }




    async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if (user.otpCode !== otpCode || new Date() > user.otpExpiresAt!) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userService.updateUser(user._id.toString(), {
            password: hashedPassword,
            otpCode: null,
            otpExpiresAt: null,
        });
    }





    async checkOTPStatus(email: string): Promise<{ valid: boolean, expiresAt?: Date }> {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        const now = new Date();
        const isValid = !!(user.otpCode && user.otpExpiresAt && now < user.otpExpiresAt);

        const result: { valid: boolean, expiresAt?: Date } = { valid: isValid };

        if (user.otpExpiresAt) {
            result.expiresAt = user.otpExpiresAt;
        }

        return result;
    }


    private generateBackupCodes(count = 8): string[] {
        return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex')); // e.g., "a3f91b2c"
    }

    private async issueTempMfaToken(user: { _id: string; email: string; role: string }) {
        // short-lived token used only to verify mfa
        return this.jwtService.sign(
            { sub: user._id.toString(), email: user.email, role: user.role, mfa: true },
            { expiresIn: '5m' },
        );
    }


    async enableMfa(userId: string) {
        const secret = speakeasy.generateSecret({
            name:` E-Learning Platform (${userId})`, // <-- fix: backticks
        });
        const backupCodes = this.generateBackupCodes();
        await this.userService.updateUser(userId, {
            mfaSecret: secret.base32,
            mfaEnabled: false,
            mfaBackupCodes: backupCodes,
        });
        return { otpauthUrl: secret.otpauth_url, base32: secret.base32, backupCodes };
    }

    async verifyMfaSetup(userId: string, token: string) {
        const user = await this.userService.findByIdSelectSecret(userId);
        if (!user?.mfaSecret) throw new UnauthorizedException('Setup mfa first');
        const ok = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!ok) throw new UnauthorizedException('Invalid TOTP');
        await this.userService.updateUser(userId, { mfaEnabled: true });
        return { enabled: true };
    }

    async verifyLoginWithMfa(userId: string, input: { token?: string; backup?: string }) {
        const user = await this.userService.findByIdSelectSecret(userId);
        if (!user?.mfaSecret || !user.mfaEnabled) {
            throw new UnauthorizedException('mfa not enabled');
        }

        let ok = false;

        if (input.token) {
            ok = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: input.token,
                window: 1,
            });
        } else if (input.backup) {
            ok = await this.userService.consumeBackupCode(userId, input.backup);
        }

        if (!ok) throw new UnauthorizedException('Invalid mfa');

        const payload = { sub: user._id.toString(), email: user.email, role: user.role };
        const access_token = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
        const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

        // (optionally rotate backup codes after success using a separate endpoint)
        return { access_token, refresh_token, user: { _id: user._id, email: user.email, role: user.role } };
    }

    async disableMfa(userId: string) {
        await this.userService.updateUser(userId, {
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: []
        });
        return { disabled: true };
    }

    async regenerateBackupCodes(userId: string) {
        const backupCodes = this.generateBackupCodes();
        await this.userService.updateUser(userId, { mfaBackupCodes: backupCodes });
        return { backupCodes };
    }



}
