import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty({
        description: 'JWT access token (7 days)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    access_token!: string;

    @ApiProperty({
        description: 'Expiration time of access token (in seconds)',
        example: 7 * 24 * 3600,
    })
    expiresIn!: number;
}

export class MfaSetupDto {
    @ApiProperty({ description: 'otpauth URL for QR code' })
    otpauthUrl!: string;

    @ApiProperty({ description: 'Base32 encoded secret key' })
    secret!: string;
}

export class SimpleMessageDto {
    @ApiProperty({ description: 'Human-readable response message', example: 'Operation completed successfully' })
    message!: string;
}
