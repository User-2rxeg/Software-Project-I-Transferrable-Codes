

import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get, HttpCode, HttpStatus,
    Param,
    ParseIntPipe,
    Patch, Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {UserService} from "./User-Service";

import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
import {Roles} from "../../Authentication/Decorators/Role-Decorator";
import {UserRole} from "../Model/User";
import {CurrentUser} from "../../Authentication/Decorators/Current-User";
import {JwtPayload} from "../../Authentication/Interfaces/JWT-Payload.Interface";
import {JwtAuthGuard} from "../../Authentication/Guards/Auth-Guard";
import {UpdateUserDto} from "../Validator/User-Validator";


import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiTags,
    ApiOperation,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import {PublicUserDto} from "../Validator/public-userDTO";

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly users: UserService) {}

    @ApiOperation({ summary: 'Find user by name' })
    @ApiOkResponse({ type: PublicUserDto })
    @Get('name/:name')
    async findByName(@Param('name') name: string) {
        return this.users.findByName(name);
    }

    @ApiOperation({ summary: 'Get current logged-in user profile' })
    @ApiOkResponse({ type: PublicUserDto })
    @Get('me')
    async me(@CurrentUser() user: JwtPayload) {
        return this.users.getUserProfile(user.sub);
    }

    @ApiOperation({ summary: 'Update my profile' })
    @ApiOkResponse({ type: PublicUserDto })
    @Patch('me')
    async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
        return this.users.updateUser(user.sub, dto);
    }

    @ApiOperation({ summary: 'Delete my account (soft/hard based on implementation)' })
    @ApiNoContentResponse()
    @Delete('me')
    async deleteMe(@CurrentUser() user: any) {
        await this.users.deleteUser(user.sub);
        return { success: true };
    }

    // Admin/Instructor search endpoints
    @UseGuards(RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    @ApiOperation({ summary: 'Search users (Admin/Instructor)' })
    @ApiOkResponse({ schema: { example: { items: [], total: 0, page: 1, pages: 0, limit: 20 } } })
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'role', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @Get('search')
    async searchUsers(
        @Query('q') q?: string,
        @Query('role') roleStr?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        const role = roleStr && Object.values(UserRole).includes(roleStr as UserRole) ? (roleStr as UserRole) : undefined;
        return this.users.searchUsers({ q, role, page, limit });
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STUDENT)
    @ApiOperation({ summary: 'Search instructors' })
    @ApiOkResponse({ schema: { example: { items: [], total: 0, page: 1, pages: 0, limit: 20 } } })
    @Get('search-instructors')
    async searchInstructors(
        @Query('q') q?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        return this.users.searchUsers({ q, role: UserRole.INSTRUCTOR, page, limit });
    }

    @ApiOperation({ summary: 'Get user by id' })
    @ApiOkResponse({ type: PublicUserDto })
    @ApiParam({ name: 'id', description: 'User ObjectId' })
    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.users.findById(id);
    }

    @ApiOperation({ summary: 'Autocomplete users (name/email suggestions)' })
    @ApiOkResponse({ schema: { example: [{ _id: '...', name: 'Alice', email: 'a@b.com', role: 'Student' }] } })
    @Get('autocomplete/:q')
    async autocomplete(@Param('q') q: string, @Query('limit') limit = '10') {
        const lnum = Number(limit) || 10;
        return this.users.autocomplete(q, lnum);
    }

    // Increment unread
    @ApiOperation({ summary: 'Increment unread notification counter for user (admin/notification-service)' })
    @ApiNoContentResponse()
    @Post(':id/unread/increment')
    @HttpCode(HttpStatus.NO_CONTENT)
    async incrementUnread(@Param('id') id: string) {
        await this.users.incrementUnread(id);
    }

    @ApiOperation({ summary: 'Reset unread notification counter for user' })
    @ApiNoContentResponse()
    @Post(':id/unread/reset')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resetUnread(@Param('id') id: string) {
        await this.users.resetUnread(id);
    }
}

// @Controller('users')
// @UseGuards(JwtAuthGuard)
// export class UserController {
//     constructor(private readonly users: UserService) {}
//
//
//     @Get('name/:name')
//     async findByName(@Param('name') name: string) {
//         return this.users.findByName(name);
//     }
//
//     @Get('me')
//     async me(@CurrentUser() user: JwtPayload) {
//         return this.users.getUserProfile(user.sub);
//     }
//
//     @Patch('me')
//     async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
//         return this.users.updateUser(user.sub, dto);
//     }
//
//     @Delete('me')
//     async deleteMe(@CurrentUser() user: any) {
//         await this.users.deleteUser(user.sub);
//         return { success: true };
//     }
//
//     @UseGuards(RolesGuard)
//     @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
//     @Get('search')
//     async searchUsers(
//         @Query('q') q?: string,
//         @Query('role') roleStr?: string,
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
//     ) {
//         const role = roleStr && Object.values(UserRole).includes(roleStr as UserRole)
//             ? (roleStr as UserRole)
//             : undefined;
//         return this.users.searchUsers({ q, role, page, limit });
//     }
//
//     @UseGuards(RolesGuard)
//     @Roles(UserRole.ADMIN, UserRole.STUDENT)
//     @Get('search-instructors')
//     async searchInstructors(
//         @Query('q') q?: string,
//         @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
//         @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
//     ) {
//         return this.users.searchUsers({ q, role: UserRole.INSTRUCTOR, page, limit });
//     }
//
//     @Get(':id')
//     async getUser(@Param('id') id: string) {
//         return this.users.findById(id);
//     }
//
//
//     @Get('autocomplete/:q')
//     async autocomplete(@Param('q') q: string, @Query('limit') limit = '10') {
//         const lnum = Number(limit) || 10;
//         return this.users.autocomplete(q, lnum);
//     }
//
//     // ----------------------
//     // Increment/reset unread notification counter
//     // (Could be called by Notification service when sending/reading notifications)
//     // ----------------------
//     @Post(':id/unread/increment')
//     @HttpCode(HttpStatus.NO_CONTENT)
//     async incrementUnread(@Param('id') id: string) {
//         await this.users.incrementUnread(id);
//     }
//
//     @Post(':id/unread/reset')
//     @HttpCode(HttpStatus.NO_CONTENT)
//     async resetUnread(@Param('id') id: string) {
//         await this.users.resetUnread(id);
//     }
//
// }
