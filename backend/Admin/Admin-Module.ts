import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {UserSchema} from "../Database/User";
import {AuthModule} from "../Authentication/Module/Authentication-Module";
import {NotificationModule} from "../Communication/Notification/Notification-Module";
import {UserModule} from "../User/User-Module";
import {AuditLogModule} from "../Audit-Log/Audit-Log.Module";
import {AdminController} from "./Admin-Controller";
import {AdminService} from "./Admin-Service";


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            //{ name: 'Course', schema: CourseSchema },
        ]),
        AuthModule,
        NotificationModule,
        UserModule,
        AuditLogModule,// ⬅ this makes UserService available
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}