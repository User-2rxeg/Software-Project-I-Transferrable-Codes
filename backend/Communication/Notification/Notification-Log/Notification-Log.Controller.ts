import { Controller, Get, Query, Param, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';


import {UserRole} from "../../../User/Model/User";
import {NotificationAuditService} from "./Notification-Log.Service";

import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiBody,
    ApiParam, ApiQuery,
} from '@nestjs/swagger';
import {NotificationAuditDto} from "../Validators/Create-Notification";
import {JwtAuthGuard} from "../../../Authentication/Guards/Authentication-Guard";
import {RolesGuard} from "../../../Authentication/Guards/Roles-Guard";
import {Roles} from "../../../Authentication/Decorators/Roles-Decorator";

@ApiTags('notifications-audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('notifications/audit')
export class NotificationAuditController {
    constructor(private readonly audit: NotificationAuditService) {}

    @Get()
    @ApiOperation({ summary: 'List notification audit entries (admin only)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    @ApiQuery({ name: 'notificationId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'eventType', required: false })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    @ApiOkResponse({ type: [NotificationAuditDto] })
    async list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('notificationId') notificationId?: string,
        @Query('userId') userId?: string,
        @Query('eventType') eventType?: 'SENT' | 'READ' | 'DELETED',
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.list({ page, limit, notificationId, userId, eventType, from, to });
    }

    @Get('by-notification/:id')
    @ApiOperation({ summary: 'Get audit entries for a specific notification' })
    @ApiParam({ name: 'id', description: 'Notification id' })
    @ApiOkResponse({ type: [NotificationAuditDto] })
    async byNotif(
        @Param('id') id: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.audit.byNotification(id, page, limit);
    }
}


