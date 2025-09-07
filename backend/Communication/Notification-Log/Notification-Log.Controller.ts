import { Controller, Get, Query, Param, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

import {JwtAuthGuard} from "../../Authentication/Guards/AuthGuard";
import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
import {Roles} from "../../Authentication/Decorators/Role-Decorator";
import {UserRole} from "../../Database/User";
import {NotificationAuditService} from "./Notification-Log.Service";

@Controller('notifications/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationAuditController {
    constructor(private readonly audit: NotificationAuditService) {}

    @Get()
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
    async byNotif(
        @Param('id') id: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.audit.byNotification(id, page, limit);
    }
}


// @Controller('notifications/audit')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class NotificationAuditController {
//     constructor(private readonly audit: NotificationAuditService) {}
//
//     // GET /notifications/audit?userId=&eventType=&from=&to=&page=&limit=
//     @Get()
//     async list(
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
//         @Query('notificationId') notificationId?: string,
//         @Query('userId') userId?: string,
//         @Query('eventType') eventType?: 'SENT'|'READ'|'DELETED',
//         @Query('from') from?: string,
//         @Query('to') to?: string,
//     ) {
//         return this.audit.list({ page, limit, notificationId, userId, eventType, from, to });
//     }
//
//     // GET /notifications/audit/by-notification/:id?page=&limit=
//     @Get('by-notification/:id')
//     async byNotif(
//         @Param('id') id: string,
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
//     ) {
//         return this.audit.byNotification(id, page, limit);
//     }
// }