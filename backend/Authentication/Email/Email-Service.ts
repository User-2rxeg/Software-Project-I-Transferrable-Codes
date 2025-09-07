import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MailAddress = string | { name?: string; address: string };

export interface SendMailOptions {
     to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: MailAddress | MailAddress[];
    bcc?: MailAddress | MailAddress[];
    replyTo?: MailAddress;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter!: nodemailer.Transporter;
    private from!: MailAddress;

    constructor(private readonly cfg: ConfigService) {
        this.boot();
    }

    private boot() {
        const provider = (this.cfg.get<string>('MAIL_PROVIDER') ?? 'smtp').toLowerCase();
        const fromName = this.cfg.get<string>('EMAIL_FROM_NAME') || 'No-Reply';
        const fromEmail = this.cfg.get<string>('EMAIL_FROM') || this.cfg.get<string>('SMTP_USER') || '';

        // Keep our DX-friendly type with optional name
        this.from = { name: fromName, address: fromEmail };

        if (!fromEmail) {
            this.logger.warn('EMAIL_FROM or SMTP_USER is not set; emails may fail SPF/DMARC alignment.');
        }

        if (provider === 'gmail-oauth2') {
            // Gmail OAuth2 (if you don’t want to use App Passwords)
            const user = this.cfg.getOrThrow<string>('SMTP_USER');
            const clientId = this.cfg.getOrThrow<string>('GMAIL_CLIENT_ID');
            const clientSecret = this.cfg.getOrThrow<string>('GMAIL_CLIENT_SECRET');
            const refreshToken = this.cfg.getOrThrow<string>('GMAIL_REFRESH_TOKEN');

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user,
                    clientId,
                    clientSecret,
                    refreshToken,
                },
            } as any);
        } else {
            // Generic SMTP (works with Outlook/Office365, Gmail App Password, etc.)
            const host = this.cfg.getOrThrow<string>('SMTP_HOST'); // e.g. smtp.office365.com / smtp.gmail.com
            const port = Number(this.cfg.get<string>('SMTP_PORT') ?? 587); // 587 STARTTLS, 465 SSL
            const secure = String(this.cfg.get<string>('SMTP_SECURE') ?? 'false') === 'true';
            const user = this.cfg.get<string>('SMTP_USER') ?? '';
            const pass = this.cfg.get<string>('SMTP_PASS') ?? '';

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: user && pass ? { user, pass } : undefined,
                tls: { ciphers: 'TLSv1.2' },
            } as any);
        }
    }

    async send(opts: SendMailOptions) {
        const payload: nodemailer.SendMailOptions = {
            from: this.from as any,
            to: opts.to as any,
            subject: opts.subject,
            text: opts.text,   // ✅ always include text
            cc: opts.cc as any,
            bcc: opts.bcc as any,
            replyTo: opts.replyTo as any,
        };

        const info = await this.transporter.sendMail(payload);
        this.logger.log(`Mail sent (ID: ${(info as any)?.messageId}) to: ${payload.to}`);

        return {
            ok: true,
            messageId: (info as any)?.messageId ?? null,
            accepted: (info as any)?.accepted ?? [],
            rejected: (info as any)?.rejected ?? [],
        };
    }
}
