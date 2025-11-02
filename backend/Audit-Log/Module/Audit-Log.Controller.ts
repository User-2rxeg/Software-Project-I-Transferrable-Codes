
import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe
} from '@nestjs/common';


import { UserRole } from '../../User/Model/User';
import {AuditLogService} from "./Audit-Log.Service";
import {CreateAuditLogDto, ListAuditQueryDto, UpdateAuditLogDto} from "../Validator/Audit-Log.Validator";
import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";


import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {PublicAuditDto} from "../Validator/PublicAuditDto";
import {JwtAuthGuard} from "../../Authentication/Guards/Authentication-Guard";
import {Roles} from "../../Authentication/Decorators/Roles-Decorator";
import {Logs} from "../Model/Logs";



@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogController {
    constructor(private readonly audit: AuditLogService) {}

    @ApiOperation({ summary: 'Create an audit log entry' })
    @ApiCreatedResponse({ type: PublicAuditDto })
    @Post()
    create(@Body() dto: CreateAuditLogDto) {
        return this.audit.create(dto);
    }

    @ApiOperation({ summary: 'List audit entries (admin)' })
    @ApiOkResponse({ description: 'Paginated list', type: [PublicAuditDto] })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'event', required: false })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    @Get()
    list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
        @Query('userId') userId?: string,
        @Query('event') event?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(page, limit, { userId, event, from, to });
    }

    @ApiOperation({ summary: 'Get a single audit entry by id' })
    @ApiOkResponse({ type: PublicAuditDto })
    @ApiParam({ name: 'id', description: 'AuditLog ObjectId' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.audit.findOne(id);
    }

    @ApiOperation({ summary: 'Update an audit entry (admin)' })
    @ApiOkResponse({ type: PublicAuditDto })
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAuditLogDto) {
        return this.audit.update(id, dto);
    }

    @ApiOperation({ summary: 'Delete an audit entry (admin)' })
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.audit.delete(id);
    }

    @ApiOperation({ summary: 'Purge audit entries older than X days' })
    @Delete('purge/older-than/:days')
    purge(@Param('days', ParseIntPipe) days: number) {
        return this.audit.purgeOlderThan(days);
    }

    @ApiOperation({ summary: 'List failed login events (security)' })
    @ApiOkResponse({ type: [PublicAuditDto] })
    @Get('security/failed-logins')
    listFailedLogins(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(page, limit, { event: 'LOGIN_FAILED', from, to });
    }

    @ApiOperation({ summary: 'List unauthorized access events (security)' })
    @ApiOkResponse({ type: [PublicAuditDto] })
    @Get('security/unauthorized')
    listUnauthorized(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findAll(page, limit, { event: 'UNAUTHORIZED_ACCESS', from, to });
    }

    @ApiOperation({ summary: 'List audit events by event type' })
    @ApiOkResponse({ type: [PublicAuditDto] })
    @Get('event/:event')
    async byEvent(
        @Param('event') event: Logs,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findByEvent(event, page, limit, from, to);
    }

    @ApiOperation({ summary: 'List audit events by user' })
    @ApiOkResponse({ type: [PublicAuditDto] })
    @Get('user/:userId')
    async byUser(
        @Param('userId') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.audit.findByUser(userId, page, limit, from, to);
    }
}
// CONSIDER ADDING MORE EVENTS OR MORE METHODS