
import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards, ParseIntPipe
} from '@nestjs/common';

import { CreateAuditLogDto, UpdateAuditLogDto } from '../DTO/AuditLog.DTO';
import { JwtAuthGuard } from '../Authentication/Guards/AuthGuard';
import { RolesGuard } from '../Authentication/Guards/RolesGuard';
import { Roles } from '../Authentication/Decorators/Roles-Decorator';
import { UserRole } from '../Database/User';
import {AuditLogService} from "./Audit-Log.Service";

@Controller('audit')

@Roles(UserRole.ADMIN)
export class AuditLogController {
    constructor(private readonly audit: AuditLogService) {}

    @Post()
    create(@Body() dto: CreateAuditLogDto) {
        return this.audit.create(dto);
    }

    @Get()
    list(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('userId') userId?: string,
        @Query('event') event?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(parseInt(page), parseInt(limit), { userId, event, from, to });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.audit.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAuditLogDto) {
        return this.audit.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.audit.delete(id);
    }

    @Delete('purge/older-than/:days')
    purge(@Param('days', ParseIntPipe) days: number) {
        return this.audit.purgeOlderThan(days);
    }

    @Get('security/failed-logins')
    listFailedLogins(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(parseInt(page), parseInt(limit), { event: 'LOGIN_FAILED', from, to });
    }

    @Get('security/unauthorized')
    listUnauthorized(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(parseInt(page), parseInt(limit), { event: 'UNAUTHORIZED_ACCESS', from, to });
    }
}