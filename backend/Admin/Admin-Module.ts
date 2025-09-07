import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {User, UserSchema} from "../Database/User";
import {AuthModule} from "../Authentication/Module/Authentication-Module";
import {NotificationModule} from "../Communication/Notification/Notification-Module";
import {UserModule} from "../User/User-Module";
import {AuditLogModule} from "../Audit-Log/Audit-Log.Module";
import {AdminController} from "./Admin-Controller";
import {AdminService} from "./Admin-Service";
import {BackupModule} from "../Backup/Backup-Module";
import {AuditLog, AuditLogSchema} from "../Database/Audit-Log";
import {NotificationSchema,Notification} from "../Database/Notification";
import {BlacklistedToken, BlacklistedTokenSchema} from "../Database/Token";
import {NotificationAuditLog, NotificationAuditLogSchema} from "../Database/Notification-Log";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        AuthModule,
        NotificationModule,
        UserModule,
        AuditLogModule,
        BackupModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}

// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: User.name, schema: UserSchema },
//             { name: Notification.name, schema: NotificationSchema },
//             { name: NotificationAuditLog.name, schema: NotificationAuditLogSchema },
//             { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
//         ]),
//         AuthModule,
//         NotificationModule,
//         UserModule,
//         AuditLogModule,
//         BackupModule,
//     ],
//     controllers: [AdminController],
//     providers: [AdminService],
// })
// export class AdminModule {}

// @Module({
//     imports: [
//         MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
//         AuthModule,
//         NotificationModule,
//         UserModule,
//         AuditLogModule,
//     ],
//     controllers: [AdminController],
//     providers: [AdminService],
// })
// export class AdminModule {}


// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: 'User', schema: UserSchema },
//             { name: 'Notification', schema: NotificationSchema },
//             { name: 'AuditLog', schema: AuditLogSchema },
//         ]),
//         AuthModule,
//         NotificationModule,
//         UserModule,
//         AuditLogModule,
//         BackupModule,
//     ],
//     controllers: [AdminController],
//     providers: [AdminService],
// })
// export class AdminModule {}

//
// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { name: 'User', schema: UserSchema },
//             //{ name: 'Course', schema: CourseSchema },
//         ]),
//         AuthModule,
//         NotificationModule,
//         UserModule,
//         AuditLogModule,// ⬅ this makes UserService available
//     ],
//     controllers: [AdminController],
//     providers: [AdminService],
// })
// export class AdminModule {}