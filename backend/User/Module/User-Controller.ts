

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

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly users: UserService) {}


    @Get('name/:name')
    async findByName(@Param('name') name: string) {
        return this.users.findByName(name);
    }

    @Get('me')
    async me(@CurrentUser() user: JwtPayload) {
        return this.users.getUserProfile(user.sub);
    }

    @Patch('me')
    async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
        return this.users.updateUser(user.sub, dto);
    }

    @Delete('me')
    async deleteMe(@CurrentUser() user: any) {
        await this.users.deleteUser(user.sub);
        return { success: true };
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
    @Get('search')
    async searchUsers(
        @Query('q') q?: string,
        @Query('role') roleStr?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        const role = roleStr && Object.values(UserRole).includes(roleStr as UserRole)
            ? (roleStr as UserRole)
            : undefined;
        return this.users.searchUsers({ q, role, page, limit });
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STUDENT)
    @Get('search-instructors')
    async searchInstructors(
        @Query('q') q?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        return this.users.searchUsers({ q, role: UserRole.INSTRUCTOR, page, limit });
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.users.findById(id);
    }


    @Get('autocomplete/:q')
    async autocomplete(@Param('q') q: string, @Query('limit') limit = '10') {
        const lnum = Number(limit) || 10;
        return this.users.autocomplete(q, lnum);
    }

    // ----------------------
    // Increment/reset unread notification counter
    // (Could be called by Notification service when sending/reading notifications)
    // ----------------------
    @Post(':id/unread/increment')
    @HttpCode(HttpStatus.NO_CONTENT)
    async incrementUnread(@Param('id') id: string) {
        await this.users.incrementUnread(id);
    }

    @Post(':id/unread/reset')
    @HttpCode(HttpStatus.NO_CONTENT)
    async resetUnread(@Param('id') id: string) {
        await this.users.resetUnread(id);
    }

}
