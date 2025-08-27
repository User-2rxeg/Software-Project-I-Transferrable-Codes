// src/user/user.controller.ts

import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards
} from '@nestjs/common';
import {UserService} from "./User-Service";

import {RolesGuard} from "../Authentication/Guards/Roles-Guard";
import {Roles} from "../Authentication/Decorators/Role-Decorator";
import {UserRole} from "../Database/User";
import {CurrentUser} from "../Authentication/Decorators/Current-User";
import {JwtPayload} from "../Authentication/Interfaces/JWT-Payload.Interface";
import {JwtAuthGuard} from "../Authentication/Guards/AuthGuard";


@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}


    // protected route: Get user by ID
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.userService.findById(id);
    }

    @Patch('me')
    async updateProfile(@CurrentUser() user: JwtPayload, @Body() updateData: Partial<any>) {
        return this.userService.updateUser(user.sub, updateData);
    }

    @Delete('me')
    async deleteProfile(@CurrentUser() user: JwtPayload) {
        return this.userService.deleteUser(user.sub);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
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
        return this.userService.searchUsers({ q, role, page, limit });
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN,UserRole.STUDENT)
    @Get('search-instructors')
    async searchInstructors(
        @Query('q') q?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    ) {
        return this.userService.searchUsers({ q, role: UserRole.INSTRUCTOR, page, limit });
    }

}
