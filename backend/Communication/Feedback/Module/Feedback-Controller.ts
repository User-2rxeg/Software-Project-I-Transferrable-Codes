
import { Body, Controller, Get, Post, Query, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { FeedbackService } from './Feedback-Service';
import { CreateFeedbackDto } from '../Validator/Feedback-Validator';
import { CurrentUser } from '../../../Authentication/Decorators/Current-User';

import { RolesGuard } from '../../../Authentication/Guards/Roles-Guard';

import { UserRole } from '../../../User/Model/User';
import {ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags} from "@nestjs/swagger";
import {PublicFeedbackDto} from "../Validator/public-feedback.dto";
import {JwtAuthGuard} from "../../../Authentication/Guards/Authentication-Guard";
import {Roles} from "../../../Authentication/Decorators/Roles-Decorator";


@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedback: FeedbackService) {}


    @ApiOperation({ summary: 'Submit feedback' })
    @ApiBearerAuth('access-token')
    @ApiCreatedResponse({ description: 'Feedback submitted', type: PublicFeedbackDto })
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() body: {
        title: string;
        description: string;
        category?: string;
        priority?: string;
    }, @CurrentUser() user: any) {
        return this.feedback.createFeedback(user.sub, body);
    }

    @ApiOperation({ summary: 'Get all feedback for current user' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'List of feedback entries', type: [PublicFeedbackDto] })
    @ApiQuery({ name: 'page', required: false, description: 'page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'page size' })
    @UseGuards(JwtAuthGuard)
    @Get()
    async getUserFeedback(
        @CurrentUser() user: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        // For now, return all feedback since we don't have user-specific filtering
        return this.feedback.list({ page: Number(page) || 1, limit: Number(limit) || 20 });
    }

    @ApiOperation({ summary: 'Get feedback by ID' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Feedback entry', type: PublicFeedbackDto })
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getFeedbackById(@Param('id') id: string) {
        return this.feedback.findById(id);
    }

    @ApiOperation({ summary: 'Update feedback' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Updated feedback', type: PublicFeedbackDto })
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateFeedback(
        @Param('id') id: string,
        @Body() body: {
            title?: string;
            description?: string;
            category?: string;
            priority?: string;
        }
    ) {
        return this.feedback.update(id, body);
    }

    @ApiOperation({ summary: 'Delete feedback' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Feedback deleted' })
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteFeedback(@Param('id') id: string) {
        return this.feedback.delete(id);
    }

    @ApiOperation({ summary: 'List all feedback (Admin only)' })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'List of feedback entries', type: [PublicFeedbackDto] })
    @ApiQuery({ name: 'q', required: false, description: 'search term for message or email' })
    @ApiQuery({ name: 'category', required: false, description: 'filter by category' })
    @ApiQuery({ name: 'page', required: false, description: 'page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'page size' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/all')
    adminList(
        @Query('q') q?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.feedback.list({ q, category, page: Number(page) || 1, limit: Number(limit) || 20 });
    }
}

