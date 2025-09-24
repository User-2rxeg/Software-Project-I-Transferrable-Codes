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
import {Model, Types} from 'mongoose';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';

import { UserService } from '../../User/Module/User-Service';

import { AuditLogService } from '../../Audit-Log/Module/Audit-Log.Service';
import {User, UserRole} from '../../User/Model/User';
import {BlacklistedToken, BlacklistedTokenDocument} from "../Token/Token";
import {MailService} from "../Email/Email-Service";
import {AuditEvent} from "../../Audit-Log/Model/Audit-Log";

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
        @InjectModel(BlacklistedToken.name) private readonly blacklistModel: Model<BlacklistedTokenDocument>,
        private readonly audit: AuditLogService,
        private readonly mail: MailService,
    ) {
    }

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


    async register(registerDto: any) {

        const existing = await this.userService.findByEmail(registerDto.email);

        if (existing) throw new UnauthorizedException('Email already in use');

        const newUser = await this.userService.create(registerDto);

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.userService.updateUserInternal(String(newUser._id), {
            isEmailVerified: false,
            otpCode,
            otpExpiresAt,
        });

        try {
            await this.mail.sendVerificationEmail(newUser.email, otpCode);
        } catch (e: any) {
            await this.audit.log(AuditEvent.OTP_SEND_FAILED, String(newUser._id), {
                email: newUser.email,
                reason: e.message,
            });
        }
        await this.audit.log(AuditEvent.USER_REGISTERED, String(newUser._id), {email: newUser.email});

        return {
            message: 'Registered. Verify email via OTP.',
            user: this.toSafeUser(newUser),
        };
    }

    async verifyOTP(email: string, otpCode: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        // validate OTP and expiry
        if (!user.otpCode || !user.otpExpiresAt || user.otpCode !== otpCode || new Date() > user.otpExpiresAt) {
            await this.audit.log(AuditEvent.OTP_SEND_FAILED, String(user._id), {
                email,
                reason: 'INVALID_OR_EXPIRED'
            }).catch(() => {
            });
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // mark email verified and clear OTPs (use internal update)
        await this.userService.updateUserInternal(user._id.toString(), {
            isEmailVerified: true,
            otpCode: null,
            otpExpiresAt: null,
        });

        await this.mail.VerifiedEmail(user.email,'Your email has been successfully verified. You can now log in to your account.');
// Still need to send email that the user is verified


        // audit success
        await this.audit.log(AuditEvent.EMAIL_VERIFIED, String(user._id), {email}).catch(() => {
        });

        // create token payload and sign
        const payload = {sub: user._id.toString(), email: user.email!, role: user.role!};
        const token = await this.jwtService.signAsync(payload);

        // return token + a minimal user projection (avoid returning internal fields)
        return {token, user: {id: user._id, email: user.email, role: user.role}};
    }


    async validateUser(email: string, plainPassword: string): Promise<SafeUser> {
        const user = await this.userService.findByEmailWithHash(email); // fetch passwordHash
        if (!user || !user.passwordHash) {
            await this.audit.log(AuditEvent.LOGIN_FAILED, undefined, {email, reason: 'UNKNOWN_EMAIL_OR_NO_PASSWORD'});
            throw new UnauthorizedException('Invalid credentials');
        }

        const ok = await bcrypt.compare(plainPassword, user.passwordHash);
        if (!ok) {
            await this.audit.log(AuditEvent.LOGIN_FAILED, String(user._id), {email, reason: 'INVALID_PASSWORD'});
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.toSafeUser(user);
    }




    async login(email: string, plainPassword: string) {
        const user = await this.validateUser(email, plainPassword);

        if (!user.isEmailVerified)
            throw new UnauthorizedException('Email not verified');

        if (user.mfaEnabled) {
            const tempToken = await this.issueTempMfaToken(user._id, user.email, user.role);
            return {mfaRequired: true, tempToken};
        }

        const payload = {sub: user._id, email: user.email, role: user.role};
        const access_token = await this.jwtService.signAsync(payload, {expiresIn: '1h'});
        const refresh_token = await this.jwtService.signAsync(payload, {expiresIn: '7d'});

        await this.audit.log(AuditEvent.LOGIN_SUCCESS, user._id, {email: user.email, role: user.role});

        return {access_token, refresh_token, user};
    }


    async logout(rawBearerToken: string) {
        const decoded: any = this.jwtService.decode(rawBearerToken);
        if (!decoded?.exp) throw new ForbiddenException('Invalid token');

        await this.blacklistModel.create({
            token: rawBearerToken,
            expiresAt: new Date(decoded.exp * 1000),
        });

        await this.audit.log(AuditEvent.LOGOUT, decoded.sub, {});

        return {message: 'Logout successful'};
    }


    // async refreshToken(refresh_token: string) {
    //     try {
    //         const decoded: any = await this.jwtService.verifyAsync(refresh_token);
    //
    //         // Optional: verify user still exists
    //         const user = await this.userService.findById(decoded.sub);
    //         if (!user) throw new UnauthorizedException('User not found');
    //
    //         const payload = {sub: decoded.sub, email: decoded.email, role: decoded.role};
    //         const access_token = await this.jwtService.signAsync(payload, {expiresIn: '1h'});
    //         const new_refresh_token = await this.jwtService.signAsync(payload, {expiresIn: '7d'});
    //
    //         return {access_token, refresh_token: new_refresh_token};
    //     } catch {
    //         throw new UnauthorizedException('Invalid refresh token');
    //     }
    // }

    async refreshToken(refresh_token: string) {
        try {
            const decoded: any = await this.jwtService.verifyAsync(refresh_token);
            // Optionally check blacklist
            const payload = { sub: decoded.sub, email: decoded.email, role: decoded.role };
            const access_token = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
            const new_refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
            return { access_token, refresh_token: new_refresh_token };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async isAccessTokenBlacklisted(token: string) {
        const hit = await this.blacklistModel.findOne({token}).select('_id').lean();
        return !!hit;
    }

//
//     private async sendOtpGeneric(
//         email: string,
//         purpose: 'verification' | 'password-reset' | 'login',
//         rateLimit: boolean,
//     ): Promise<void> {
//         const user = await this.userService.findByEmail(email);
//         if (!user) throw new NotFoundException('User not found');
//
//         // Prevent sending verification OTP if already verified
//         if (purpose === 'verification' && user.isEmailVerified) {
//             throw new BadRequestException('Email already verified');
//         }
//
//         const lastExpiry = (purpose === 'password-reset' ? user.passwordResetOtpExpiresAt : user.otpExpiresAt) ?? null;
//         if (rateLimit && lastExpiry && Date.now() - lastExpiry.getTime() < 2 * 60 * 1000) {
//             throw new BadRequestException('Please wait before requesting a new OTP');
//         }
//
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//         const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
//
//         if (purpose === 'password-reset') {
//             await this.userService.updateUserInternal(String(user._id), {
//                 passwordResetOtpCode: otpCode,
//                 passwordResetOtpExpiresAt: otpExpiresAt,
//             });
//         } else {
//             await this.userService.updateUserInternal(String(user._id), {
//                 otpCode: otpCode,
//                 otpExpiresAt: otpExpiresAt,
//             });
//         }
//
//         try {
//             if (purpose === 'verification') {
//                 await this.mail.sendVerificationEmail(user.email!, otpCode);
//                 await this.audit.log(AuditEvent.OTP_SENT, String(user._id), { purpose: 'verification' }).catch(()=>{});
//             } else if (purpose === 'password-reset') {
//                 await this.mail.sendPasswordResetEmail(user.email!, otpCode);
//                 await this.audit.log(AuditEvent.PASSWORD_RESET_REQUESTED, String(user._id), {}).catch(()=>{});
//             } else {
//                 await this.mail.sendVerificationEmail(user.email!, otpCode); // or a login template
//                 await this.audit.log(AuditEvent.OTP_SENT, String(user._id), { purpose: 'login' }).catch(()=>{});
//             }
//         } catch (err) {
//             await this.audit.log(AuditEvent.OTP_SEND_FAILED, String(user._id), {
//                 email: user.email,
//                 purpose,
//                 reason: err?.message ?? String(err),
//             }).catch(()=>{});
//             // do not throw, keep soft fail to allow retry resending
//         }
//     }
// // Update Reset Password part to use Reset-Password fields in the database instead of the general otp
    private async sendOtpGeneric(
        email: string,
        purpose: 'verification' | 'password-reset' | 'login',
        rateLimit: boolean,
    ): Promise<void> {
        // 1) find user (public view is fine)
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if(purpose==='verification' && user.isEmailVerified){
            throw new BadRequestException('Email is already verified');
        }

        // 2) rate-limit: require at least 2 minutes between OTPs when rateLimit=true
        const lastExpiry = user.otpExpiresAt ?? null;
        if (rateLimit && lastExpiry && (Date.now() - lastExpiry.getTime()) < 2 * 60 * 1000) {
            throw new BadRequestException('Please wait before requesting a new OTP');
        }

        // 3) generate OTP and expiry
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 4) persist OTP using internal update (not public DTO)
        await this.userService.updateUserInternal(String(user._id), {otpCode, otpExpiresAt});

        //const lastExpiry = (purpose === 'password-reset' ? user.passwordResetOtpExpiresAt : user.otpExpiresAt) ?? null;
//         if (rateLimit && lastExpiry && Date.now() - lastExpiry.getTime() < 2 * 60 * 1000) {
//             throw new BadRequestException('Please wait before requesting a new OTP');
//         }
//
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//         const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
//
//         if (purpose === 'password-reset') {
//             await this.userService.updateUserInternal(String(user._id), {
//                 passwordResetOtpCode: otpCode,
//                 passwordResetOtpExpiresAt: otpExpiresAt,
//             });
//         } else {
//             await this.userService.updateUserInternal(String(user._id), {
//                 otpCode: otpCode,
//                 otpExpiresAt: otpExpiresAt,
//             });
//         }
        // 5) prepare mail subject/body via MailService (your existing service)
        try {
            if (purpose === 'verification') {
                await this.mail.sendVerificationEmail(user.email!, otpCode);
                await this.audit.log(AuditEvent.OTP_SENT, String(user._id), {purpose: 'verification'}).catch(() => {
                });
            } else if (purpose === 'password-reset') {
                await this.mail.sendPasswordResetEmail(user.email!, otpCode);
                await this.audit.log(AuditEvent.PASSWORD_RESET_REQUESTED, String(user._id), {requested: true}).catch(() => {
                });
            } else { // login OTP / TOTP fallback
                // you may not have a dedicated template; reuse verification template
                await this.mail.sendVerificationEmail(user.email!, otpCode);
                await this.audit.log(AuditEvent.OTP_SENT, String(user._id), {purpose: 'login'}).catch(() => {
                });
            }
        } catch (err: any) {
            // Don't prevent the flow for email failures; audit the failure for operator visibility
            await this.audit.log(AuditEvent.OTP_SEND_FAILED, String(user._id), {
                email: user.email,
                purpose,
                reason: err?.message ?? String(err),
            }).catch(() => {
            });
            // optionally rethrow if you prefer hard-fail (we keep it soft to match register behavior)
        }
    }

    async sendOTP(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'verification', false);
        return {message: 'OTP sent to email'};
    }

    async resendOTP(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'verification', true);
        return {message: 'OTP resent successfully'};
    }

    async checkOTPStatus(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');
        const now = new Date();
        const valid = !!(user.otpCode && user.otpExpiresAt && now < user.otpExpiresAt);
        return {valid, expiresAt: user.otpExpiresAt ?? undefined};
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        await this.sendOtpGeneric(email, 'password-reset', false);
        return {message: 'Password reset OTP sent to email'};
    }

    async resetPassword(email: string, otpCode: string, newPassword: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) throw new NotFoundException('User not found');

        if (!user.passwordResetOtpCode || !user.passwordResetOtpExpiresAt || user.passwordResetOtpCode !== otpCode || new Date() > user.passwordResetOtpExpiresAt) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        // update internals: passwordHash and clear OTP fields
        await this.userService.updateUserInternal(user._id.toString(), {
            passwordHash,
            passwordResetOtpCode: null,
            passwordResetOtpExpiresAt: null,
        });

        await this.audit.log(AuditEvent.PASSWORD_CHANGED, String(user._id), {method: 'otp-reset'}).catch(() => {
        });
    }


    private generateBackupCodes(count = 8): string[] {
        return Array.from({length: count}, () => crypto.randomBytes(4).toString('hex'));
    }

    async regenerateBackupCodes(userId: string) {
        const backupCodes = this.generateBackupCodes();
        await this.userService.updateUserInternal(userId, {mfaBackupCodes: backupCodes});
        await this.audit.log(AuditEvent.MFA_ENABLED, userId, {action: 'regen_backup_codes'}).catch(() => {
        });
        return {backupCodes};
    }

    private async issueTempMfaToken(userId: string, email: string, role: string) {
        return this.jwtService.sign({sub: userId, email, role, mfa: true}, {expiresIn: '5m'});
    }


    async enableMfa(userId: string) {
        // create TOTP secret (otpauth_url for QR)
        const secret = speakeasy.generateSecret({name: `Platform (${userId})`});
        const backupCodes = this.generateBackupCodes();


        await this.userService.updateUserInternal(userId, {
            mfaSecret: secret.base32,
            mfaBackupCodes: backupCodes,
            mfaEnabled: false,
        });

        // audit the setup generation (not final enable)
        await this.audit.log(
            AuditEvent.MFA_ENABLED,
            userId ? new Types.ObjectId(userId) : undefined,
            {action: 'setup_generated'}
        ).catch(() => {
        });

        return {otpauthUrl: secret.otpauth_url, base32: secret.base32, backupCodes};
    }


    async verifyMfaSetup(userId: string, token: string) {
        const user = await this.userService.findByIdSelectSecret(userId);
        if (!user || !user.mfaSecret) {
            throw new UnauthorizedException('MFA not initialized for user');
        }

        const ok = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1, // +/- 1 step tolerance
        });

        if (!ok) {
            await this.audit.log(AuditEvent.MFA_DISABLED, userId, {reason: 'invalid_setup_token'}).catch(() => {
            });
            throw new UnauthorizedException('Invalid TOTP token');
        }

        // mark MFA as enabled
        await this.userService.updateUserInternal(userId, {mfaEnabled: true});

        await this.audit.log(AuditEvent.MFA_ENABLED, userId, {action: 'enabled'}).catch(() => {
        });
        return {enabled: true};
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
            await this.audit.log(AuditEvent.LOGIN_FAILED, userId, {reason: 'invalid_mfa'}).catch(() => {
            });
            throw new UnauthorizedException('Invalid MFA token or backup code');
        }

        // issue normal access + refresh tokens now
        const payload = {sub: user._id.toString(), email: user.email, role: user.role};
        const access_token = await this.jwtService.signAsync(payload, {expiresIn: '1h'});
        const refresh_token = await this.jwtService.signAsync(payload, {expiresIn: '7d'});

        await this.audit.log(AuditEvent.LOGIN_SUCCESS, userId, {mfa: true}).catch(() => {
        });
        return {access_token, refresh_token, user: {_id: user._id, email: user.email, role: user.role}};
    }


    async disableMfa(userId: string) {
        await this.userService.updateUserInternal(userId, {
            mfaEnabled: false,
            mfaSecret: null,
            mfaBackupCodes: [],
        });

        await this.audit.log(AuditEvent.MFA_DISABLED, userId, {action: 'disabled'}).catch(() => {
        });
        return {disabled: true};
    }


}



