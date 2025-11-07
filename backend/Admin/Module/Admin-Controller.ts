
import {Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiQuery, ApiParam, ApiConsumes } from '@nestjs/swagger';


import path from "path";

import { Response } from 'express';
import {CreateUserDto, UpdateUserDto} from "../../User/Validator/User-Validator";
import {JwtAuthGuard} from "../../Authentication/Guards/Authentication-Guard";
import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
import {Roles} from "../../Authentication/Decorators/Roles-Decorator";
import {AdminService} from "./Admin-Service";
import {UserRole} from "../../User/Model/User";
import {AnnounceAllDto, AnnounceRoleDto, UpdateUserRoleBodyDto} from "../Validator/Admin-Validator";
import {CurrentUser} from "../../Authentication/Decorators/Current-User";
import {UserService} from "../../User/Module/User-Service";

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly admin: AdminService, private readonly users: UserService) {}

    @ApiOperation({ summary: 'Create a new user as admin' })
    @ApiCreatedResponse({ description: 'User created' })
    @Post('create-user')
    async createUser(@Body() dto: CreateUserDto, @Query('adminId') adminId?: string) {
        return this.admin.createUserByAdmin(dto, adminId!);
    }

    @ApiOperation({ summary: 'Update a user by id' })
    @ApiOkResponse({ description: 'User updated' })
    @Patch(':id')
    async updateById(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.users.updateUser(id, dto);
    }

    @ApiOperation({ summary: 'Delete a user (hard delete) by id' })
    @ApiOkResponse({ description: 'User deleted' })
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.users.deleteUser(id);
        return { deleted: true };
    }

    @ApiOperation({ summary: 'List users with optional filters' })
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'role', required: false, enum: Object.values(UserRole) })
    @ApiQuery({ name: 'verified', required: false, description: 'true|false' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @Get('users')
    listUsers(
        @Query('q') q?: string,
        @Query('role') role?: UserRole,
        @Query('verified') verified?: 'true' | 'false',
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.admin.listUsers({
            q,
            role,
            verified,
            page: Number(page),
            limit: Number(limit),
        });
    }

    @ApiOperation({ summary: 'Update a user role (Admin only)' })
    @ApiParam({ name: 'id', description: 'User ObjectId' })
    @ApiOkResponse({ description: 'Role updated' })
    @Patch('users/:id/role')
    updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
        return this.users.updateUserRole(id, body.role);
    }

    @ApiOperation({ summary: 'Export users as CSV (downloads file)' })
    @ApiOkResponse({ description: 'CSV file download' })
    @Get('users/export')
    async exportUsers(@Res() res: Response) {
        const { filepath } = await this.admin.exportUsersCSV();
        res.download(filepath, path.basename(filepath));
    }

    @ApiOperation({ summary: 'Get admin metrics/summary' })
    @Get('metrics')
    metrics() {
        return this.admin.metrics();
    }

    @ApiOperation({ summary: 'Get security overview metrics' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'from', required: false })
    @ApiQuery({ name: 'to', required: false })
    @Get('security')
    security(@Query('limit') limit?: string, @Query('from') from?: string, @Query('to') to?: string) {
        return this.admin.securityOverview({ limit: Number(limit ?? '50'), from, to });
    }

    @ApiOperation({ summary: 'Send announcement to all users' })
    @ApiCreatedResponse({ description: 'Announcement queued' })
    @Post('announce/all')
    announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
        return this.admin.announceAll(adminUser.sub, body.message);
    }

    @ApiOperation({ summary: 'Send announcement to a role' })
    @ApiCreatedResponse({ description: 'Announcement queued to role' })
    @Post('announce/role')
    announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
        return this.admin.announceRole(adminUser.sub, body.role, body.message);
    }

}

