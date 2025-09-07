
import {Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards} from '@nestjs/common';

import { JwtAuthGuard } from '../Authentication/Guards/AuthGuard';


import {RolesGuard} from "../Authentication/Guards/Roles-Guard";
import { Roles } from '../Authentication/Decorators/Role-Decorator';
import { UserRole } from '../Database/User';
import {AdminService} from "./Admin-Service";
import {UserService} from "../User/User-Service";
import {CurrentUser} from "../Authentication/Decorators/Current-User";
import {JwtPayload} from "../Authentication/Interfaces/JWT-Payload.Interface";
import {
    AnnounceAllDto,
    AnnounceRoleDto,
    UpdateUserRoleBodyDto
} from "../Validators/Admin-Validator";
import path from "path";

import { Response } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(
        private readonly admin: AdminService,
        private readonly users: UserService,
    ) {}

    // USERS
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

    @Patch('users/:id/lock')
    lockUser(@Param('id') id: string, @CurrentUser() adminUser: any) {
        return this.admin.lockUser(id, adminUser.sub);
    }

    @Patch('users/:id/unlock')
    unlockUser(@Param('id') id: string, @CurrentUser() adminUser: any) {
        return this.admin.unlockUser(id, adminUser.sub);
    }

    // @Post('users/:id/force-logout')
    // forceLogout(@Param('id') id: string, @CurrentUser() adminUser: any) {
    //     return this.admin.forceLogoutUser(id, adminUser.sub);
    // }

    @Get('users/export')
    async exportUsers(@Res() res: Response) {
        const { filepath } = await this.admin.exportUsersCSV();
        res.download(filepath, path.basename(filepath));
    }

    // METRICS & SECURITY
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

    // ANNOUNCEMENTS
    @Post('announce/all')
    announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
        return this.admin.announceAll(adminUser.sub, body.message);
    }

    @Post('announce/role')
    announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
        return this.admin.announceRole(adminUser.sub, body.role, body.message);
    }
}
// WOULD LIKE TO ADD ANY MORE FUNCTIONS??

// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class AdminController {
//     constructor(
//         private readonly admin: AdminService,
//         private readonly users: UserService,
//     ) {}
//
//     // USERS
//     @Get('users')
//     listUsers(
//         @Query('q') q?: string,
//         @Query('role') role?: UserRole,
//         @Query('verified') verified?: 'true' | 'false',
//         @Query('page') page?: string,
//         @Query('limit') limit?: string,
//     ) {
//         return this.admin.listUsers({
//             q,
//             role,
//             verified,
//             page: Number(page),
//             limit: Number(limit),
//         });
//     }
//
//     @Patch('users/:id/role')
//     updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
//         return this.users.updateUserRole(id, body.role);
//     }
//
//     // NEW: Lock / Unlock (soft delete toggle)
//     @Patch('users/:id/lock')
//     lockUser(@Param('id') id: string, @CurrentUser() admin: any) {
//         return this.admin.lockUser(id, admin.sub);
//     }
//
//     @Patch('users/:id/unlock')
//     unlockUser(@Param('id') id: string, @CurrentUser() admin: any) {
//         return this.admin.unlockUser(id, admin.sub);
//     }
//
//     // METRICS & SECURITY
//     @Get('metrics')
//     metrics() {
//         return this.admin.metrics();
//     }
//
//     @Get('security')
//     security(
//         @Query('limit') limit?: string,
//         @Query('from') from?: string,
//         @Query('to') to?: string,
//     ) {
//         return this.admin.securityOverview({ limit: Number(limit ?? '50'), from, to });
//     }
//
//     // ANNOUNCEMENTS
//     @Post('announce/all')
//     announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceAll(adminUser.sub, body.message);
//     }
//
//     @Post('announce/role')
//     announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceRole(adminUser.sub, body.role, body.message);
//     }
//
//     @Post('users/:id/force-logout')
//     forceLogout(@Param('id') id: string, @CurrentUser() admin: any) {
//         return this.admin.forceLogoutUser(id, admin.sub);
//     }
//
//     @Get('users/export')
//     async exportUsers(@Res() res: Response) {
//         const { filepath } = await this.admin.exportUsersCSV();
//         res.download(filepath, path.basename(filepath));
//     }
// }



// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class AdminController {
//     constructor(
//         private readonly admin: AdminService,
//         private readonly users: UserService,
//     ) {}
//
//     // ---- USERS ----
//     @Get('users')
//     listUsers(
//         @Query('q') q?: string,
//         @Query('role') role?: UserRole,
//         @Query('verified') verified?: 'true' | 'false',
//         @Query('page') page?: string,
//         @Query('limit') limit?: string,
//     ) {
//         return this.admin.listUsers({
//             q,
//             role,
//             verified,
//             page: Number(page),
//             limit: Number(limit),
//         });
//     }
//
//     @Patch('users/:id/role')
//     async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
//         return this.users.updateUserRole(id, body.role);
//     }
//
//     // ---- METRICS & SECURITY ----
//     @Get('metrics')
//     getMetrics() {
//         return this.admin.metrics();
//     }
//
//     @Get('security')
//     security(@Query('limit') limit = '50') {
//         return this.admin.securityOverview(Number(limit));
//     }
//
//     // ---- ANNOUNCEMENTS ----
//     @Post('announce/all')
//     announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceAll(adminUser.sub, body.message);
//     }
//
//     @Post('announce/role')
//     announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceRole(adminUser.sub, body.role, body.message);
//     }
//
//     // ---- BACKUPS ----
//     @Post('backups')
//     createBackup(@Body() body: { backupType: 'full' | 'incremental'; location: string }) {
//         return this.admin.createBackup(body);
//     }
//
//     @Get('backups')
//     listBackups(@Query('limit') limit = '20', @Query('page') page = '1') {
//         return this.admin.listBackups(Number(limit), Number(page));
//     }
//
//     @Post('backups/:id/restore')
//     restoreBackup(@Param('id') id: string) {
//         return this.admin.restoreBackup(id);
//     }
// }

// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class AdminController {
//     constructor(
//         private readonly admin: AdminService,
//         private readonly users: UserService,
//     ) {}
//
//     // --- USERS ---
//     @Get('users')
//     listUsers(
//         @Query('q') q?: string,
//         @Query('role') role?: UserRole,
//         @Query('verified') verified?: 'true' | 'false',
//         @Query('page') page?: string,
//         @Query('limit') limit?: string,
//     ) {
//         return this.admin.listUsers({
//             q,
//             role,
//             verified,
//             page: Number(page),
//             limit: Number(limit),
//         });
//     }
//
//     @Patch('users/:id/role')
//     async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
//         return this.users.updateUserRole(id, body.role);
//     }
//
//     // --- ANNOUNCEMENTS ---
//     @Post('announce/all')
//     announceAll(@Body() body: AnnounceAllDto, @CurrentUser() admin: any) {
//         return this.admin.announceAll(admin.sub, body.message);
//     }
//
//     @Post('announce/role')
//     announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() admin: any) {
//         return this.admin.announceRole(admin.sub, body.role, body.message);
//     }
// }


// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class AdminController {
//     constructor(
//         private readonly admin: AdminService,
//         private readonly users: UserService,
//     ) {}
//
//     // USERS
//     @Get('users')
//     listUsers(
//         @Query('q') q?: string,
//         @Query('role') role?: UserRole,
//         @Query('verified') verified?: 'true' | 'false',
//         @Query('page') page?: string,
//         @Query('limit') limit?: string,
//     ) {
//         return this.admin.listUsers({
//             q,
//             role,
//             verified,
//             page: Number(page),
//             limit: Number(limit),
//         });
//     }
//
//     @Patch('users/:id/role')
//     updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
//         return this.users.updateUserRole(id, body.role);
//     }
//
//     // NEW: Lock / Unlock (soft delete toggle)
//     @Patch('users/:id/lock')
//     lockUser(@Param('id') id: string, @CurrentUser() admin: any) {
//         return this.admin.lockUser(id, admin.sub);
//     }
//
//     @Patch('users/:id/unlock')
//     unlockUser(@Param('id') id: string, @CurrentUser() admin: any) {
//         return this.admin.unlockUser(id, admin.sub);
//     }
//
//     // METRICS & SECURITY
//     @Get('metrics')
//     metrics() {
//         return this.admin.metrics();
//     }
//
//     @Get('security')
//     security(
//         @Query('limit') limit?: string,
//         @Query('from') from?: string,
//         @Query('to') to?: string,
//     ) {
//         return this.admin.securityOverview({ limit: Number(limit ?? '50'), from, to });
//     }
//
//     // ANNOUNCEMENTS
//     @Post('announce/all')
//     announceAll(@Body() body: AnnounceAllDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceAll(adminUser.sub, body.message);
//     }
//
//     @Post('announce/role')
//     announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() adminUser: any) {
//         return this.admin.announceRole(adminUser.sub, body.role, body.message);
//     }
// }

// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
// export class AdminController {
//     constructor(
//         private readonly admin: AdminService,
//         private readonly users: UserService,
//     ) {}
//
//     // --- USERS ---
//     @Get('users')
//     listUsers(
//         @Query('q') q?: string,
//         @Query('role') role?: UserRole,
//         @Query('verified') verified?: 'true'|'false',
//         @Query('page') page?: string,
//         @Query('limit') limit?: string,
//     ) {
//         return this.admin.listUsers({ q, role, verified, page: Number(page), limit: Number(limit) });
//     }
//
//     @Patch('users/:id/role')
//     async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
//         return this.users.updateUserRole(id, body.role);
//     }
//
//
//
//     // // --- ANNOUNCEMENTS ---
//     // @Post('announce/all')
//     // announceAll(@Body() body: AnnounceAllDto, @CurrentUser() admin: JwtPayload) {
//     //     return this.admin.announceAll(admin.sub, body.message);
//     // }
//     //
//     // @Post('announce/role')
//     // announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() admin: JwtPayload) {
//     //     return this.admin.announceRole(admin.sub, body.role, body.message);
//     // }
//      //Quick views for security events
// }
//
// // --- COURSES ---
// //@Get('courses')
// //listCourses(
// //@Query('q') q?: string,
// //@Query('status') status?: 'active'|'archived'|'draft',
// //@Query('page') page?: string,
// //  @Query('limit') limit?: string,
// //) {
// //  return this.admin.listCourses({ q, status, page: Number(page), limit: Number(limit) });
// //}
//
// //@Patch('courses/:id/status')
// //updateCourseStatus(@Param('id') id: string, @Body() body: UpdateCourseStatusBodyDto) {
// //  return this.admin.updateCourseStatus(id, body.status);
// //}
// //@Get('enrollments')
// //enrollments(
// //  @Query('q') q?: string,
// //@Query('courseId') courseId?: string,
// //@Query('userId') userId?: string,
// //@Query('page') page?: string,
// //@Query('limit') limit?: string,
// //) {
// //  return this.admin.listEnrollments({ q, courseId, userId, page: Number(page), limit: Number(limit) });
// // }
//
// //@Post('announce/course')
// //announceCourse(@Body() body: AnnounceCourseDto, @CurrentUser() admin: JwtPayload) {
// //  return this.admin.announceCourse(admin.sub, body.courseId, body.message, body.to ?? 'all');
// //}
//
// //@Patch('courses/:id/archive')
// //archiveCourse(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
// //  return this.admin.archiveCourse(id, admin.sub);
// //}
//
// // Remove (hard delete) a course
// //@Delete('courses/:id')
// //removeCourse(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
// //  return this.admin.removeCourse(id, admin.sub);
// //}
//
// // (optional) Bulk-archive courses created at/before a given date (YYYY-MM-DD or ISO)
// //@Post('courses/archive-outdated')
// //archiveOutdated(@Query('before') before: string, @CurrentUser() admin: JwtPayload) {
// //  return this.admin.archiveOutdated(before, admin.sub);
//}