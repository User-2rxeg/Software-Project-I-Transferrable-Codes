
import {Global, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {AuditLogService} from "./Audit-Log.Service";
import {AuditLogController} from "./Audit-Log.Controller";
import {AuditLog, AuditLogSchema} from "../Database/Audit-Log";
import {AuthModule} from "../Authentication/Module/Authentication-Module";


@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
        AuthModule,
    ],

    providers: [AuditLogService],
    controllers: [AuditLogController],
    exports: [AuditLogService],
})
export class AuditLogModule {}