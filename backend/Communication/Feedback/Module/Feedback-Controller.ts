
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './Feedback-Service';
import { CreateFeedbackDto } from '../Validator/Feedback-Validator';
import { CurrentUser } from '../../../Authentication/Decorators/Current-User';
import { JwtAuthGuard } from '../../../Authentication/Guards/Auth-Guard';
import { RolesGuard } from '../../../Authentication/Guards/Roles-Guard';
import { Roles } from '../../../Authentication/Decorators/Role-Decorator';
import { UserRole } from '../../../User/Model/User';
import {ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags} from "@nestjs/swagger";
import {PublicFeedbackDto} from "../Validator/public-feedback.dto";


@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedback: FeedbackService) {}


    @ApiOperation({ summary: 'Submit feedback (public)' })
    @ApiCreatedResponse({ description: 'Feedback submitted', type: PublicFeedbackDto })
    @Post()
    async create(@Body() body: CreateFeedbackDto, @CurrentUser() user?: any) {
        return this.feedback.create({
            userId: user?.sub,
            message: body.message,
            contactEmail: body.contactEmail,
            category: body.category,
        });
    }


    @ApiOperation({ summary: 'List feedback (Admin only)' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'List of feedback entries', type: [PublicFeedbackDto] })
    @ApiQuery({ name: 'q', required: false, description: 'search term for message or email' })
    @ApiQuery({ name: 'category', required: false, description: 'filter by category' })
    @ApiQuery({ name: 'page', required: false, description: 'page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'page size' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin')
    list(
        @Query('q') q?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.feedback.list({ q, category, page: Number(page) || 1, limit: Number(limit) || 20 });
    }
}

