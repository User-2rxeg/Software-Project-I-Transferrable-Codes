import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
    @IsString()
    @MaxLength(4000)
    message!: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    category?: string; // general | bug | idea | other
}