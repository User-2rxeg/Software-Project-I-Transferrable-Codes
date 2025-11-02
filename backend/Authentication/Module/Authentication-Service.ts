import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

import { UserService } from '../../User/Module/User-Service';
import { AuditLogService } from '../../Audit-Log/Module/Audit-Log.Service';
import { UserRole } from '../../User/Model/User';

import { MailService } from '../Email/Email-Service';

import { CreateUserDto } from '../../User/Validator/User-Validator';
import {BlacklistedToken, BlackListedTokenDocument,} from "../Token/blacklisted-token.schema";
import {normalizeBearerToken} from "../Token/token.helper";
import {Logs} from "../../Audit-Log/Model/Logs";



type SafeUser = {
    _id: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    mfaEnabled: boolean;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectModel(BlacklistedToken.name) private readonly blacklistModel: Model<BlackListedTokenDocument>,
        private readonly audit: AuditLogService,
        private readonly mail: MailService,
    ) {}

    private toSafeUser(doc: any): SafeUser {
        const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        return {
            _id: String(obj._id),
            email: obj.email,
            role: obj.role,
            isEmailVerified: !!obj.isEmailVerified,
            mfaEnabled: !!obj.mfaEnabled,
        };
    }


    async register(dto: CreateUserDto) {
        const existing = await this.userService.findByEmail(dto.email);
        if (existing) throw new UnauthorizedException('Email already in use');

        const newUser = await this.userService.create(dto);

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.userService.updateUserInternal(String(newUser._id), {
            isEmailVerified: false,
            otpCode,
            otpExpiresAt,
        });

        try {
            await this.mail.sendVerificationEmail(newUser.email, otpCode);
            await this.audit.log(Logs.OTP_SENT, String(newUser._id), { purpose: 'verification' }).catch(() => {});
        } catch (e: any) {
            await this.audit.log(Logs.OTP_SEND_FAILED, String(newUser._id), {
                email: newUser.email,
                reason: e?.message ?? String(e),
            }).catch(() => {});
        }

        await this.audit.log(Logs.USER_REGISTERED, String(newUser._id), { email: newUser.email }).catch(() => {});

        return {
            message: 'Registered. Verify email via OTP.',
            user: this.toSafeUser(newUser),
        };
    }

    async verifyOTP(email: string, otpCode: string) {

        const user = await this.userService.findByEmail(email);

        if (!user) throw new NotFoundException('User not found');


        if (!user.otpCode || !user.otpExpiresAt || user.otpCode !== otpCode || new Date() > user.otpExpiresAt) {
            await this.audit.log(Logs.OTP_SEND_FAILED, String(user._id), {
                email,
                reason: 'INVALID_OR_EXPIRED'
            }).catch(() => {
            });
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        await this.userService.updateUserInternal(user._id.toString(), {
            isEmailVerified: true,
            otpCode: null,
            otpExpiresAt: null,
        });

        await this.mail.VerifiedEmail(user.email,'Your email has been successfully verified. You can now log in to your account.');

        await this.audit.log(Logs.EMAIL_VERIFIED, String(user._id), {email}).catch(() => {
        });

        return { user: {id: user._id, email: user.email, role: user.role}};
    }



    async validateUser(email: string, plainPassword: string): Promise<SafeUser> {
        const user = await this.userService.findByEmailWithHash(email);

        if (!user || !user.passwordHash) {
            await this.audit
                .log(Logs.LOGIN_FAILED, undefined, { email, reason: 'UNKNOWN_EMAIL_OR_NO_PASSWORD' })
                .catch(() => {});
            throw new UnauthorizedException('Invalid credentials');
        }

        const ok = await bcrypt.compare(plainPassword, user.passwordHash);
        if (!ok) {
            await this.audit.log(Logs.LOGIN_FAILED, String(user._id), { email, reason: 'INVALID_PASSWORD' }).catch(() => {});
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.toSafeUser(user);
    }

    async login(email: string, plainPassword: string) {
        const user = await this.validateUser(email, plainPassword);

        if (!user.isEmailVerified) throw new UnauthorizedException('Email not verified');

        if (user.mfaEnabled) {
            const tempToken = await this.issueTempMfaToken(user._id, user.email, user.role);
            return { mfaRequired: true, tempToken };
        }

        const payload = { sub: user._id, email: user.email, role: user.role };
        const access_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

        await this.audit.log(Logs.LOGIN_SUCCESS, user._id, { email: user.email, role: user.role }).catch(() => {});

        return { access_token, user };
    }


    // async logout(rawBearerToken: string) {
    //     const token = normalizeBearerToken(rawBearerToken) ?? rawBearerToken;
    //     const decoded: any = this.jwtService.decode(token);
    //
    //     if (!decoded?.exp) throw new ForbiddenException('Invalid token');
    //
    //     // store the raw token (not "Bearer ...") and TTL index uses expiresAt
    //     try {
    //         await this.blacklistModel.create({
    //             token,
    //             expiresAt: new Date(decoded.exp * 1000),
    //         });
    //     } catch (err: any) {
    //         // ignore duplicate key error if already blacklisted
    //         if (err?.code && err.code !== 11000) throw err;
    //     }
    //
    //     await this.audit.log(AuditEvent.LOGOUT, decoded.sub, {}).catch(() => {});
    //
    //     return { message: 'Logout successful' };
    // }

    async logout(rawBearerToken: string) {
        const token = normalizeBearerToken(rawBearerToken);
        if (!token) throw new BadRequestException('No token provided');

        // verify signature & expiry (trusted)
        let decoded: any;
        try {
            decoded = await this.jwtService.verifyAsync(token);
        } catch {
            // invalid or already expired -> no-op (logout success)
            return { message: 'Logout successful' };
        }

        try {
            await this.blacklistModel.create({
                token, // normalized (no "Bearer ")
                expiresAt: new Date(decoded.exp * 1000),
            });
        } catch (err: any) {
            if (err.code !== 11000) throw err; // ignore duplicate-key
        }

        await this.audit.log(Logs.LOGOUT, decoded.sub, {}).catch(()=>{});
        return { message: 'Logout successful' };
    }
    async isAccessTokenBlacklisted(token: string) {
        const hit = await this.blacklistModel.findOne({ token }).select('_id').lean();
        return !!hit;
    }

    private async sendOtpGeneric(
        email: string,
        purpose: 'verification' | 'password-reset' | 'login',
        rateLimit: boolean,
    ): Promise<void> {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if (purpose === 'verification' && user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        // determine last expiry field depending on purpose
        const lastExpiry = purpose === 'password-reset' ? user.passwordResetOtpExpiresAt ?? null : user.otpExpiresAt ?? null;
        if (rateLimit && lastExpiry && Date.now() - lastExpiry.getTime() < 2 * 60 * 1000) {
            throw new BadRequestException('Please wait before requesting a new OTP');
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        if (purpose === 'password-reset') {
            await this.userService.updateUserInternal(String(user._id), {
                passwordResetOtpCode: otpCode,
                passwordResetOtpExpiresAt: otpExpiresAt,
            });
        } else {
            await this.userService.updateUserInternal(String(user._id), {
                otpCode,
                otpExpiresAt,
            });
        }

        try {
            if (purpose === 'verification') {
                await this.mail.sendVerificationEmail(user.email!, otpCode);
                await this.audit.log(Logs.OTP_SENT, String(user._id), { purpose: 'verification' }).catch(() => {});
            } else if (purpose === 'password-reset') {
                await this.mail.sendPasswordResetEmail(user.email!, otpCode);
                await this.audit.log(Logs.PASSWORD_RESET_REQUESTED, String(user._id), {}).catch(() => {});
            } else {
                await this.mail.sendVerificationEmail(user.email!, otpCode); // reuse template for login OTP
                await this.audit.log(Logs.OTP_SENT, String(user._id), { purpose: 'login' }).catch(() => {});
            }
        } catch (err: any) {
            await this.audit
                .log(Logs.OTP_SEND_FAILED, String(user._id), {
                    email: user.email,
                    purpose,
                    reason: err?.message ?? String(err),
                })
                .catch(() => {});
        }
    }

    async sendOTP(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'verification', false);
        return { message: 'OTP sent to email' };
    }

    async resendOTP(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'verification', true);
        return { message: 'OTP resent successfully' };
    }

    async checkOTPStatus(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');
        const now = new Date();
        const valid = !!(user.otpCode && user.otpExpiresAt && now < user.otpExpiresAt);
        return { valid, expiresAt: user.otpExpiresAt ?? undefined };
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'password-reset', false);
        return { message: 'Password reset OTP sent to email' };
    }

    async resetPassword(email: string, otpCode: string, newPassword: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if (
            !user.passwordResetOtpCode ||
            !user.passwordResetOtpExpiresAt ||
            user.passwordResetOtpCode !== otpCode ||
            new Date() > user.passwordResetOtpExpiresAt
        ) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.userService.updateUserInternal(user._id.toString(), {
            passwordHash,
            passwordResetOtpCode: null,
            passwordResetOtpExpiresAt: null,
        });

        await this.audit.log(Logs.PASSWORD_CHANGED, String(user._id), { method: 'otp-reset' }).catch(() => {});
        return { message: 'Password changed' };
    }

    // ---------- MFA ----------
    private generateBackupCodes(count = 8): string[] {
        return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex'));
    }

    async regenerateBackupCodes(userId: string) {
        const backupCodes = this.generateBackupCodes();
        await this.userService.updateUserInternal(userId, { mfaBackupCodes: backupCodes });
        await this.audit.log(Logs.MFA_ENABLED, userId, { action: 'regen_backup_codes' }).catch(() => {});
        return { backupCodes };
    }

    private async issueTempMfaToken(userId: string, email: string, role: string) {
        // use signAsync for consistency
        return this.jwtService.signAsync({ sub: userId, email, role, mfa: true }, { expiresIn: '5m' });
    }

    async enableMfa(userId: string) {
        const secret = speakeasy.generateSecret({ name: `Platform (${userId})` });
        const backupCodes = this.generateBackupCodes();

        await this.userService.updateUserInternal(userId, {
            mfaSecret: secret.base32,
            mfaBackupCodes: backupCodes,
            mfaEnabled: false,
        });

        await this.audit
            .log(Logs.MFA_ENABLED, userId ? new Types.ObjectId(userId) : undefined, { action: 'setup_generated' })
            .catch(() => {});

        return { otpauthUrl: secret.otpauth_url, base32: secret.base32, backupCodes };
    }

    async verifyMfaSetup(userId: string, token: string) {
        const user = await this.userService.findByIdSelectSecret(userId);
        if (!user || !user.mfaSecret) throw new UnauthorizedException('MFA not initialized for user');

        const ok = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!ok) {
            await this.audit.log(Logs.MFA_DISABLED, userId, { reason: 'invalid_setup_token' }).catch(() => {});
            throw new UnauthorizedException('Invalid TOTP token');
        }

        await this.userService.updateUserInternal(userId, { mfaEnabled: true });
        await this.audit.log(Logs.MFA_ENABLED, userId, { action: 'enabled' }).catch(() => {});
        return { enabled: true };
    }

    async verifyLoginWithMfa(userId: string, input: { token?: string; backup?: string }) {
        const user = await this.userService.findByIdSelectSecret(userId);
        if (!user) throw new UnauthorizedException('User not found');
        if (!user.mfaEnabled) throw new UnauthorizedException('MFA not enabled');

        let ok = false;
        if (input.token) {
            ok = speakeasy.totp.verify({
                secret: user.mfaSecret!,
                encoding: 'base32',
                token: input.token,
                window: 1,
            });
        } else if (input.backup) {
            ok = await this.userService.consumeBackupCode(userId, input.backup);
        }

        if (!ok) {
            await this.audit.log(Logs.LOGIN_FAILED, userId, { reason: 'invalid_mfa' }).catch(() => {});
            throw new UnauthorizedException('Invalid MFA token or backup code');
        }

        // Issue the normal access token for 7 days (no refresh tokens)
        const payload = { sub: user._id.toString(), email: user.email, role: user.role };
        const access_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

        await this.audit.log(Logs.LOGIN_SUCCESS, userId, { mfa: true }).catch(() => {});
        return { access_token, user: { _id: user._id.toString(), email: user.email, role: user.role } };
    }

    async disableMfa(userId: string) {
        await this.userService.updateUserInternal(userId, {
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: [],
        });

        await this.audit.log(Logs.MFA_DISABLED, userId, { action: 'disabled' }).catch(() => {});
        return { disabled: true };
    }
}

