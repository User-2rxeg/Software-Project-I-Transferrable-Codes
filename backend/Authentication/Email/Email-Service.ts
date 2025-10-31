import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor() {

            this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: (process.env.SMTP_SECURE === 'true') || false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
        logger: true,
        debug: true,
    });

    this.transporter.verify()
.then(() => console.log('Mail transporter verified/connected OK'))
.catch(err => console.error('Mail transporter verify error:',err));

    }



    async sendVerificationEmail(email: string, otp: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Verification - Education Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B5CF6;">Account Verification</h2>
                  <p>Hello,</p>
                  <p>Thank you for registering with Educational Platform. Please verify your account to continue.</p>
                  <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="font-size: 32px; color: #8B5CF6; margin: 0; letter-spacing: 5px;">${otp}</h1>
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #6b7280;">Automated email from HR System. Please do not reply.</p>
                </div>
            `,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendPasswordResetEmail(email: string, otp: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - Education Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B5CF6;">Password Reset Request</h2>
                  <p>Hello,</p>
                  <p>You requested to reset your password for your Educational Platform account.</p>
                  <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="font-size: 32px; color: #8B5CF6; margin: 0; letter-spacing: 5px;">${otp}</h1>
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you didn't request this, ignore this email.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #6b7280;">Automated email from Educational Platform. Please do not reply.</p>
                </div>
            `,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async VerifiedEmail(email: string, otp: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Verification - Education Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B5CF6;">Account Verification</h2>
                  <p>Hello,</p>
                  <p>Thank you for registering with Educational Platform. Your Account has been verified.</p>
                  <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="font-size: 32px; color: #8B5CF6; margin: 0; letter-spacing: 5px;">${otp}</h1>
                  </div>
                  <p>This code will expire in 10 minutes.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #6b7280;">Automated email from Educational Platform. Please do not reply.</p>
                </div>
            `,
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendNotificationEmail(email: string, subject: string, messageHtmlOrText: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html: `<div>${messageHtmlOrText}</div>`,
        };
        return this.transporter.sendMail(mailOptions);
    }


    async sendFeedbackEmail(to: string, subject: string, html: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        };
        return this.transporter.sendMail(mailOptions);
    }
}