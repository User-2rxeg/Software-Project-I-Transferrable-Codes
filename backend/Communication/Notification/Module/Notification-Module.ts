import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { Notification, NotificationSchema } from '../Models/Notification';
import { NotificationAuditLog, NotificationAuditLogSchema } from '../Models/Notification-Log';
import { User, UserSchema } from '../../../User/Model/User';

import { AuthModule } from '../../../Authentication/Module/Authentication-Module';


import { NotificationService } from './Notification-Service';
import { NotificationGateway } from '../Gateway/Notification-Gateway';
import { NotificationController } from './Notification-Controller';
import { NotificationAuditController } from '../Notification-Log/Notification-Log.Controller';
import { NotificationAuditService } from '../Notification-Log/Notification-Log.Service';
import {MailModule} from "../../../Authentication/Email/Email-Module";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
            { name: NotificationAuditLog.name, schema: NotificationAuditLogSchema },
            { name: User.name, schema: UserSchema },
        ]),
        AuthModule,
        MailModule,                 // <-- make MailService available here
        JwtModule.register({}),     // optional if you need JWT inside this module
    ],
    providers: [NotificationService, NotificationGateway, NotificationAuditService],
    controllers: [NotificationController, NotificationAuditController],
    exports: [NotificationService],
})
export class NotificationModule {}














// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from '@nestjs/jwt';
//
//
// import {NotificationAuditLog, NotificationAuditLogSchema} from "../../Model/Notification-Log";
// import {User, UserSchema} from "../../Model/User";
// import {AuthModule} from "../../Authentication/Module/Authentication-Module";
// import {NotificationService} from "./Notification-Service";
// import {NotificationGateway} from "../Gateway/Notification-Gateway";
// import {NotificationController} from "./Notification-Controller";
// import {NotificationAuditController} from "../Notification-Log/Notification-Log.Controller";
// import {NotificationAuditService} from "../Notification-Log/Notification-Log.Service";
// import {NotificationSchema, Notification} from "../../Model/Notification";
//
//
// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: 'Notification', schema: NotificationSchema },
//             { name: NotificationAuditLog.name, schema: NotificationAuditLogSchema },
//             //{ name: Course.name, schema: CourseSchema },
//             { name: User.name, schema: UserSchema },
//         ]),
//         AuthModule,
//         JwtModule.register({}), // ensure same secret as HTTP auth via AuthModule or env
//     ],
//     providers: [NotificationService, NotificationGateway,NotificationAuditService],
//     controllers: [NotificationController,NotificationAuditController],
//     exports: [NotificationService],
// })
// export class NotificationModule {}



//@Module({
//     imports: [
//         forwardRef(() => AuthModule),
//         MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
//     ],
//     providers: [NotificationsService],
//     controllers: [NotificationsController],
//     exports: [NotificationsService],
// })
// export class NotificationsModule {}

//
// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from '@nestjs/jwt';
//
// import { Notification, NotificationSchema } from '../../Model/notifications/notification.schema';
// import { NotificationAuditLog, NotificationAuditLogSchema } from '../../Model/notifications/notification-audit.schema';
// import { User, UserSchema } from '../../Model/user.schema';
// import { Course, CourseSchema } from '../../Model/course.schema';
//
// import { NotificationsService } from './notifications.service';
// import { NotificationsController } from './notifications.controller';
// import { NotificationGateway } from './notifications.gateway';
// import { AuthModule } from '../../Authentication/AuthModule';
//
// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: Notification.name, schema: NotificationSchema },
//             { name: NotificationAuditLog.name, schema: NotificationAuditLogSchema },
//             { name: User.name, schema: UserSchema },
//             { name: Course.name, schema: CourseSchema },
//         ]),
//         AuthModule,
//         JwtModule.register({}), // uses same provider/secret exported by AuthModule
//     ],
//     controllers: [NotificationsController],
//     providers: [NotificationsService, NotificationGateway],
//     exports: [NotificationsService],
// })
// export class NotificationsModule {}