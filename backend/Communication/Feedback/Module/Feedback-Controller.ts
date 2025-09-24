// src/Feedback/Feedback-Controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './Feedback-Service';
import { CreateFeedbackDto } from '../Validator/Feedback-Validator';
import { CurrentUser } from '../../../Authentication/Decorators/Current-User';
import { JwtAuthGuard } from '../../../Authentication/Guards/Auth-Guard';
import { RolesGuard } from '../../../Authentication/Guards/Roles-Guard';
import { Roles } from '../../../Authentication/Decorators/Role-Decorator';
import { UserRole } from '../../../User/Model/User';

@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedback: FeedbackService) {}

    // Public endpoint to submit feedback; CurrentUser optional
    @Post()
    async create(@Body() body: CreateFeedbackDto, @CurrentUser() user?: any) {
        return this.feedback.create({
            userId: user?.sub,
            message: body.message,
            contactEmail: body.contactEmail,
            category: body.category,
        });
    }


    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    list(
        @Query('q') q?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.feedback.list({ q, category, page: Number(page), limit: Number(limit) });
    }
}