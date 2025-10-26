import { IsOptional, IsString, Length } from 'class-validator';


export class MfaActivateDto {
    @IsString()
    @Length(6, 6)
    token!: string;
}

export class VerifyLoginDto {
    @IsOptional()
    @IsString()
    @Length(6, 6)
    token?: string;

    @IsOptional()
    @IsString()
    backup?: string;
}



