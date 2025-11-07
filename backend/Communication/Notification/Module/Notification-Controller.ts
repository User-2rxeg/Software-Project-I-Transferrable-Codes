import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {RolesGuard} from "../../../Authentication/Guards/Roles-Guard";

import {NotificationService} from "./Notification-Service";

import {CurrentUser} from "../../../Authentication/Decorators/Current-User";
import {CreateNotificationDto, NotificationDto} from "../Validators/Create-Notification";
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import {JwtAuthGuard} from "../../../Authentication/Guards/Authentication-Guard";


@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
    constructor(private readonly notifications: NotificationService) {}

    @Post()
    @ApiOperation({ summary: 'Create a notification (admin/instructor/system)' })
    @ApiBody({ type: CreateNotificationDto })
    @ApiCreatedResponse({ type: NotificationDto })
    create(@Body() dto: CreateNotificationDto, @CurrentUser() user: any) {
        return this.notifications.createNotification(dto, user.sub);
    }

    @Get()
    @ApiOperation({ summary: 'Get my notifications (latest first)' })
    @ApiOkResponse({ type: [NotificationDto] })
    getMine(@CurrentUser() user: any) {
        return this.notifications.getUserNotifications(user.sub);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a single notification as read' })
    @ApiParam({ name: 'id', description: 'Notification id' })
    @ApiOkResponse({ type: NotificationDto })
    markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
        return this.notifications.markAsRead(id, user.sub);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read for current user' })
    @ApiOkResponse({ description: 'Operation result' })
    markAll(@CurrentUser() user: any) {
        return this.notifications.markAllAsRead(user.sub);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notifications count' })
    @ApiOkResponse({ description: 'Unread count (number)' })
    unread(@CurrentUser() user: any) {
        return this.notifications.countUnread(user.sub);
    }

    // Uncomment and protect if you want delete capability
    // @Delete(':id')
    // @ApiOperation({ summary: 'Delete a notification' })
    // @ApiParam({ name: 'id', description: 'Notification id' })
    // @ApiOkResponse({ description: 'Deleted' })
    // remove(@Param('id') id: string, @CurrentUser() user: any) {
    //   return this.notifications.deleteNotification(id, user.sub);
    // }
}



// @Controller('notifications')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class NotificationController {
//     constructor(private readonly notifications: NotificationService) {}
//
//     @Post()
//     create(@Body() dto: CreateNotificationDto, @CurrentUser() user: any) {
//         return this.notifications.createNotification(dto, user.sub);
//     }
//
//     @Get()
//     getMine(@CurrentUser() user: any) {
//         return this.notifications.getUserNotifications(user.sub);
//     }
//
//     @Patch(':id/read')
//     markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
//         return this.notifications.markAsRead(id, user.sub);
//     }
//
//     @Patch('mark-all-read')
//     markAll(@CurrentUser() user: any) {
//         return this.notifications.markAllAsRead(user.sub);
//     }
//
//     // @Delete(':id')
//     // remove(@Param('id') id: string, @CurrentUser() user: any) {
//     //     return this.notifications.deleteNotification(id, user.sub);
//     // }
//
//     @Get('unread-count')
//     unread(@CurrentUser() user: any) {
//         return this.notifications.countUnread(user.sub);
//     }
//
//     // @Get('list')
//     // list(
//     //     @CurrentUser() user: any,
//     //     @Query('limit') limit = '20',
//     //     @Query('cursor') cursor?: string,
//     //     @Query('unreadOnly') unreadOnly?: string,
//     // ) {
//     //     return this.notifications.list(user.sub, Number(limit), cursor, unreadOnly === 'true');
//     // }
//     //
//     // @Patch('read-many')
//     // readMany(@CurrentUser() user: any, @Body() body: { ids: string[] }) {
//     //     return this.notifications.markManyAsRead(user.sub, body.ids ?? []);
//     // }
//     //
//     // @Delete('delete-many')
//     // deleteMany(@CurrentUser() user: any, @Body() body: { ids: string[] }) {
//     //     return this.notifications.deleteMany(user.sub, body.ids ?? []);
//     // }
// }












// import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
//
// import { CurrentUser } from '../../Authentication/Decorators/Current-User';
// import { JwtPayload } from '../../Authentication/Interfaces/JWT-Payload.Interface';
// import {JwtAuthGuard} from "../../Authentication/Guards/AuthGuard";
// import {RolesGuard} from "../../Authentication/Guards/Roles-Guard";
// import {NotificationService} from "./Notification-Service";
// import {CreateNotificationDto} from "../../Validators/Notification-Validator";
//
// @Controller('notifications')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class NotificationController {
//     constructor(private readonly notificationService: NotificationService) {}
//
//     // @Post()
//     // create(@Body() dto: CreateNotificationDto, @CurrentUser() user: JwtPayload) {
//     //     return this.notificationService.createNotification(dto, user.sub);
//     // }
//
//     @Get()
//     getMine(@CurrentUser() user: JwtPayload) {
//         return this.notificationService.getUserNotifications(user.sub);
//     }
//
//     @Patch(':id/read')
//     markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
//         return this.notificationService.markAsRead(id, user.sub);
//     }
//
//     @Patch('mark-all-read')
//     markAll(@CurrentUser() user: JwtPayload) {
//         return this.notificationService.markAllAsRead(user.sub);
//     }
//
//     @Delete(':id')
//     remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
//         return this.notificationService.deleteNotification(id, user.sub);
//     }
// }


// import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
// import { NotificationsService } from './notifications.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { CreateNotificationDto } from '../dto/notifications/create-notification.dto';
//
// @Controller('notifications')
// @UseGuards(JwtAuthGuard)
// export class NotificationsController {
//     constructor(private readonly svc: NotificationsService) {}
//
//     @Get()
//     list(@CurrentUser() user: any, @Query('limit') limit = 20, @Query('cursor') cursor?: string, @Query('unreadOnly') unreadOnly?: string) {
//         return this.svc.list(user.userId, Number(limit), cursor, unreadOnly === 'true');
//     }
//
//     @Get('unread-count')
//     unreadCount(@CurrentUser() user: any) {
//         return this.svc.countUnread(user.userId);
//     }
//
//     @Post('mark-read')
//     markRead(@CurrentUser() user: any, @Body() body: { ids: string[] }) {
//         return this.svc.markRead(user.userId, body.ids);
//     }
//
//     // admin/system hook (protect with RolesGuard)
//     @Post()
//     adminCreate(@Body() dto: CreateNotificationDto) {
//         return this.svc.createFor(dto.user, dto);
//     }
// }



// import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Notification, NotificationDocument } from '../../Model/notifications/notification.schema';
// import { NotificationAuditLog, NotificationAuditLogDocument } from '../../Model/notifications/notification-audit.schema';
// import { CreateNotificationDto } from '../../dto/notifications/notification.dto';
// import { User, UserDocument, UserRole } from '../../Model/user.schema';
// import { Course, CourseDocument } from '../../Model/course.schema';
// import { NotificationGateway } from './notifications.gateway';
//
// @Injectable()
// export class NotificationsService {
//     constructor(
//         @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
//         @InjectModel(NotificationAuditLog.name) private readonly auditModel: Model<NotificationAuditLogDocument>,
//         @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//         @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
//         private readonly gateway: NotificationGateway,
//     ) {}
//
//     async create(dto: CreateNotificationDto, senderId: string) {
//         const sender = await this.userModel.findById(senderId).lean();
//         if (!sender) throw new NotFoundException('Sender not found');
//
//         if (dto.courseId) {
//             const exists = await this.courseModel.exists({ _id: dto.courseId });
//             if (!exists) throw new NotFoundException('Course not found');
//         }
//
//         // basic policy
//         if (dto.type === 'announcement' && !(sender.role === UserRole.ADMIN || sender.role === UserRole.INSTRUCTOR)) {
//             throw new ForbiddenException('Not allowed to send announcements');
//         }
//         if (sender.role === UserRole.STUDENT && dto.recipientId !== senderId) {
//             throw new ForbiddenException('Students cannot send notifications to others');
//         }
//
//         const doc = await this.notificationModel.create({
//             recipientId: new Types.ObjectId(dto.recipientId),
//             type: dto.type,
//             message: dto.message,
//             courseId: dto.courseId ? new Types.ObjectId(dto.courseId) : undefined,
//             sentBy: new Types.ObjectId(senderId),
//         });
//
//         await this.auditModel.create({
//             notificationId: doc._id,
//             eventType: 'SENT',
//             userId: new Types.ObjectId(senderId),
//         });
//
//         // realtime
//         this.gateway.emitToUser(String(doc.recipientId), 'notification:new', {
//             id: String(doc._id),
//             type: doc.type,
//             message: doc.message,
//             createdAt: doc.createdAt,
//             read: doc.read,
//             courseId: doc.courseId ? String(doc.courseId) : undefined,
//             sentBy: String(doc.sentBy),
//         });
//
//         return doc;
//     }
//
//     async markAsRead(notificationId: string, userId: string) {
//         const n = await this.notificationModel.findById(notificationId);
//         if (!n) throw new NotFoundException('Notification not found');
//         if (String(n.recipientId) !== userId) throw new ForbiddenException('Not allowed');
//
//         if (!n.read) {
//             n.read = true;
//             await n.save();
//
//             await this.auditModel.create({
//                 notificationId: n._id,
//                 eventType: 'READ',
//                 userId: new Types.ObjectId(userId),
//             });
//
//             this.gateway.emitToUser(userId, 'notification:read', { id: String(n._id) });
//         }
//         return n;
//     }
//
//     async markAllAsRead(userId: string) {
//         const uid = new Types.ObjectId(userId);
//         await this.notificationModel.updateMany({ recipientId: uid, read: false }, { $set: { read: true } });
//
//         const updated = await this.notificationModel.find({ recipientId: uid, read: true }).select('_id').lean();
//         if (updated.length) {
//             await this.auditModel.insertMany(
//                 updated.map(x => ({ notificationId: x._id, eventType: 'READ', userId: uid }))
//             );
//             this.gateway.emitToUser(userId, 'notification:readAll', { ids: updated.map(x => String(x._id)) });
//         }
//         return { ok: true, count: updated.length };
//     }
//
//     async remove(notificationId: string, actorId: string) {
//         const n = await this.notificationModel.findById(notificationId);
//         if (!n) throw new NotFoundException('Notification not found');
//
//         // allow owner or admin
//         if (String(n.recipientId) !== actorId) {
//             const actor = await this.userModel.findById(actorId).lean();
//             if (!actor || actor.role !== UserRole.ADMIN) throw new ForbiddenException('Not allowed');
//         }
//
//         await this.notificationModel.findByIdAndDelete(notificationId);
//
//         await this.auditModel.create({
//             notificationId: n._id,
//             eventType: 'DELETED',
//             userId: new Types.ObjectId(actorId), // actor (fix)
//         });
//
//         this.gateway.emitToUser(String(n.recipientId), 'notification:deleted', { id: String(n._id) });
//         return { ok: true };
//     }
//
//     async list(userId: string, limit = 20, cursor?: string, unreadOnly?: boolean) {
//         const filter: any = { recipientId: new Types.ObjectId(userId) };
//         if (unreadOnly) filter.read = false;
//
//         const q = this.notificationModel.find(filter).sort({ _id: -1 }).limit(limit);
//         if (cursor) q.where('_id').lt(new Types.ObjectId(cursor));
//         return q.lean();
//     }
// }


// import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
// import { NotificationsService } from './notifications.service';
// import { JwtAuthGuard } from '../../Authentication/Guards/AuthGuard';
// import { RolesGuard } from '../../Authentication/Guards/RolesGuard'; // if you use it
// import { CurrentUser } from '../../Authentication/Decorators/Current-User';
// import { JwtPayload } from '../../Authentication/Interfaces/JWT-Payload.Interface';
// import { CreateNotificationDto } from '../../dto/notifications/notification.dto';
//
// @Controller('notifications')
// @UseGuards(JwtAuthGuard) // add RolesGuard per-endpoint if needed
// export class NotificationsController {
//     constructor(private readonly svc: NotificationsService) {}
//
//     @Post()
//     create(@Body() dto: CreateNotificationDto, @CurrentUser() user: JwtPayload) {
//         return this.svc.create(dto, user.sub);
//     }
//
//     @Get()
//     list(
//         @CurrentUser() user: JwtPayload,
//         @Query('limit') limit = '20',
//         @Query('cursor') cursor?: string,
//         @Query('unreadOnly') unreadOnly?: string,
//     ) {
//         return this.svc.list(user.sub, Number(limit), cursor, unreadOnly === 'true');
//     }
//
//     @Patch(':id/read')
//     markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
//         return this.svc.markAsRead(id, user.sub);
//     }
//
//     @Patch('mark-all-read')
//     markAll(@CurrentUser() user: JwtPayload) {
//         return this.svc.markAllAsRead(user.sub);
//     }
//
//     @Delete(':id')
//     remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
//         return this.svc.remove(id, user.sub);
//     }
// }