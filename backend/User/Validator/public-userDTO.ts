// src/users/dto/public-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {UserRole} from "../Model/User";


export class PublicUserDto {
    @ApiProperty({ example: '64b8f7a0c2f4e9b3f1a2d3c4', description: 'MongoDB ObjectId' })
    _id!: string;

    @ApiProperty({ example: 'Alice Example' })
    name!: string;

    @ApiProperty({ example: 'alice@example.com' })
    email!: string;

    @ApiProperty({ enum: Object.values(UserRole) })
    role!: UserRole;

    @ApiPropertyOptional({ example: true })
    isEmailVerified?: boolean;

    @ApiPropertyOptional({ example: 0 })
    unreadNotificationCount?: number;

    @ApiProperty({ type: String, format: 'date-time' })
    createdAt!: Date;

    @ApiProperty({ type: String, format: 'date-time' })
    updatedAt!: Date;
}
