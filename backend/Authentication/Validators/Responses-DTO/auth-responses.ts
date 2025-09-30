import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty({
        description: 'JWT access token (short-lived)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken!: string;

    @ApiProperty({
        description: 'JWT refresh token (long-lived)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken!: string;

    @ApiProperty({
        description: 'Expiration time of access token (in seconds)',
        example: 3600,
    })
    expiresIn!: number;
}

export class MfaSetupDto {
    @ApiProperty({
        description: 'otpauth URL for QR code (Google Authenticator, Authy, etc.)',
        example:
            'otpauth://totp/MyApp:email@example.com?secret=BASE32SECRET&issuer=MyApp',
    })
    otpauthUrl!: string;

    @ApiProperty({
        description: 'Base32 encoded secret key for manual entry',
        example: 'JBSWY3DPEHPK3PXP',
    })
    secret!: string;
}

export class SimpleMessageDto {
    @ApiProperty({
        description: 'Human-readable response message',
        example: 'Operation completed successfully',
    })
    message!: string;
}
