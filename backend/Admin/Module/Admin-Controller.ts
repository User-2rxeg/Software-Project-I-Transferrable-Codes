
import {Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards} from '@nestjs/common';

import { JwtAuthGuard } from '../../Authentication/Guards/Auth-Guard';


import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
import { Roles } from '../../Authentication/Decorators/Role-Decorator';
import { UserRole } from '../../User/Model/User';
import {AdminService} from "./Admin-Service";
import {UserService} from "../../User/Module/User-Service";
import {CurrentUser} from "../../Authentication/Decorators/Current-User";
import {JwtPayload} from "../../Authentication/Interfaces/JWT-Payload.Interface";
import {
    AnnounceAllDto,
    AnnounceRoleDto,
    UpdateUserRoleBodyDto
} from "../Validator/Admin-Validator";
import path from "path";

import { Response } from 'express';
import {CreateUserDto, UpdateUserDto} from "../../User/Validator/User-Validator";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(
        private readonly admin: AdminService,
        private readonly users: UserService,
    ) {}


    @Post('create-user')
    async createUser(@Body() dto: CreateUserDto, @Query('adminId') adminId?: string) {
        // adminId could be extracted from JWT as well
        return this.admin.createUserByAdmin(dto, adminId!);
    }


@Patch(':id')
    async updateById(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.users.updateUser(id, dto);
    }


    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.users.deleteUser(id);
        return { deleted: true };
    }

    @Post(':id/soft-delete')
    async softDelete(@Param('id') id: string) {
        return this.users.softDelete(id);
    }

    @Post(':id/restore')
    async restore(@Param('id') id: string) {
        return this.users.restore(id);
    }


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

    @Patch('users/:id/role')
    updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
        return this.users.updateUserRole(id, body.role);
    }



    @Get('users/export')
    async exportUsers(@Res() res: Response) {
        const { filepath } = await this.admin.exportUsersCSV();
        res.download(filepath, path.basename(filepath));
    }


    @Get('metrics')
    metrics() {
        return this.admin.metrics();
    }

    @Get('security')
    security(
        @Query('limit') limit?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.admin.securityOverview({ limit: Number(limit ?? '50'), from, to });
    }


    @Post('announce/all')
    announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
        return this.admin.announceAll(adminUser.sub, body.message);
    }

    @Post('announce/role')
    announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
        return this.admin.announceRole(adminUser.sub, body.role, body.message);
    }

    // @Post('users/:id/force-logout')
    // forceLogout(@Param('id') id: string, @CurrentUser() adminUser: any) {
    //     return this.admin.forceLogoutUser(id, adminUser.sub);
    // }

    @Patch('users/:id/lock')
    lockUser(@Param('id') id: string, @CurrentUser() adminUser: any) {
        return this.admin.lockUser(id, adminUser.sub);
    }

    @Patch('users/:id/unlock')
    unlockUser(@Param('id') id: string, @CurrentUser() adminUser: any) {
        return this.admin.unlockUser(id, adminUser.sub);
    }
}
