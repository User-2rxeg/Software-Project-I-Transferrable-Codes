import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {User, UserSchema} from "../../User/Model/User";
import {AuthModule} from "../../Authentication/Module/Authentication-Module";
import {NotificationModule} from "../../Communication/Notification/Module/Notification-Module";
import {UserModule} from "../../User/Module/User-Module";
import {AuditLogModule} from "../../Audit-Log/Module/Audit-Log.Module";
import {AdminController} from "./Admin-Controller";
import {AdminService} from "./Admin-Service";

import {AuditLog, AuditLogSchema} from "../../Audit-Log/Model/Audit-Log";
import {NotificationSchema,Notification} from "../../Communication/Notification/Models/Notification";

import {NotificationAuditLog, NotificationAuditLogSchema} from "../../Communication/Notification/Models/Notification-Log";

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

    ],
    controllers: [AdminController],
    providers: [AdminService],

})
export class AdminModule {}



