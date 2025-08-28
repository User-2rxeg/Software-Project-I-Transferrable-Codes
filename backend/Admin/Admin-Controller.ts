
import {Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from '@nestjs/common';

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
    AnnounceCourseDto,
    AnnounceRoleDto,
    UpdateCourseStatusBodyDto,
    UpdateUserRoleBodyDto
} from "../Validators/Admin-Validator";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(
        private readonly admin: AdminService,
        private readonly users: UserService,
    ) {}

    // --- USERS ---
    @Get('users')
    listUsers(
        @Query('q') q?: string,
        @Query('role') role?: UserRole,
        @Query('verified') verified?: 'true'|'false',
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.admin.listUsers({ q, role, verified, page: Number(page), limit: Number(limit) });
    }

    @Patch('users/:id/role')
    async updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleBodyDto) {
        return this.users.updateUserRole(id, body.role);
    }



    // --- ANNOUNCEMENTS ---
    @Post('announce/all')
    announceAll(@Body() body: AnnounceAllDto, @CurrentUser() admin: JwtPayload) {
        return this.admin.announceAll(admin.sub, body.message);
    }

    @Post('announce/role')
    announceRole(@Body() body: AnnounceRoleDto, @CurrentUser() admin: JwtPayload) {
        return this.admin.announceRole(admin.sub, body.role, body.message);
    }
    // Quick views for security events
}

// --- COURSES ---
//@Get('courses')
//listCourses(
//@Query('q') q?: string,
//@Query('status') status?: 'active'|'archived'|'draft',
//@Query('page') page?: string,
//  @Query('limit') limit?: string,
//) {
//  return this.admin.listCourses({ q, status, page: Number(page), limit: Number(limit) });
//}

//@Patch('courses/:id/status')
//updateCourseStatus(@Param('id') id: string, @Body() body: UpdateCourseStatusBodyDto) {
//  return this.admin.updateCourseStatus(id, body.status);
//}
//@Get('enrollments')
//enrollments(
//  @Query('q') q?: string,
//@Query('courseId') courseId?: string,
//@Query('userId') userId?: string,
//@Query('page') page?: string,
//@Query('limit') limit?: string,
//) {
//  return this.admin.listEnrollments({ q, courseId, userId, page: Number(page), limit: Number(limit) });
// }

//@Post('announce/course')
//announceCourse(@Body() body: AnnounceCourseDto, @CurrentUser() admin: JwtPayload) {
//  return this.admin.announceCourse(admin.sub, body.courseId, body.message, body.to ?? 'all');
//}

//@Patch('courses/:id/archive')
//archiveCourse(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
//  return this.admin.archiveCourse(id, admin.sub);
//}

// Remove (hard delete) a course
//@Delete('courses/:id')
//removeCourse(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
//  return this.admin.removeCourse(id, admin.sub);
//}

// (optional) Bulk-archive courses created at/before a given date (YYYY-MM-DD or ISO)
//@Post('courses/archive-outdated')
//archiveOutdated(@Query('before') before: string, @CurrentUser() admin: JwtPayload) {
//  return this.admin.archiveOutdated(before, admin.sub);
//}