import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";









export class CreateFeedbackDto {
    @ApiProperty({
        description: 'The feedback message body',
        example: 'I found a bug on the course page where videos stop at 3:05.',
        maxLength: 4000,
    })
    @IsString()
    @MaxLength(4000)
    message!: string;

    @ApiPropertyOptional({
        description: 'Optional contact email if you want a reply',
        example: 'alice@example.com',
    })
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @ApiPropertyOptional({
        description: "Feedback category, e.g. 'general' | 'bug' | 'idea' | 'other'",
        example: 'bug',
    })
    @IsOptional()
    @IsString()
    category?: string;
}

// export class CreateFeedbackDto {
//     @IsString()
//     @MaxLength(4000)
//     message!: string;
//
//     @IsOptional()
//     @IsEmail()
//     contactEmail?: string;
//
//     @IsOptional()
//     @IsString()
//     category?: string; // general | bug | idea | other
// }