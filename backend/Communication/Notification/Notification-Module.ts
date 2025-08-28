import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { Notification, NotificationSchema } from '../../Database/Notification';
import {NotificationAuditLog, NotificationAuditLogSchema} from "../../Database/Notification-Log";
import {User, UserSchema} from "../../Database/User";
import {AuthModule} from "../../Authentication/Module/Authentication-Module";
import {NotificationService} from "./Notification-Service";
import {NotificationGateway} from "../Gateways/Notification-Gateway";
import {NotificationController} from "./Notification-Controller";


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
            { name: NotificationAuditLog.name, schema: NotificationAuditLogSchema },
            //{ name: Course.name, schema: CourseSchema },
            { name: User.name, schema: UserSchema },
        ]),
        AuthModule,
        JwtModule.register({}), // ensure same secret as HTTP auth via AuthModule or env
    ],
    providers: [NotificationService, NotificationGateway],
    controllers: [NotificationController],
    exports: [NotificationService],
})
export class NotificationModule {}



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
// import { Notification, NotificationSchema } from '../../Database/notifications/notification.schema';
// import { NotificationAuditLog, NotificationAuditLogSchema } from '../../Database/notifications/notification-audit.schema';
// import { User, UserSchema } from '../../Database/user.schema';
// import { Course, CourseSchema } from '../../Database/course.schema';
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