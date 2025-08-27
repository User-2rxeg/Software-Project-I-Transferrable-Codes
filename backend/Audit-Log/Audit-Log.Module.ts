
import {Global, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../Database/AuditLog';
import {AuditLogService} from "./Audit-Log.Service";
import {AuditLogController} from "./Audit-Log.Controller";
import {AuthModule} from "../Authentication/AuthModule";

@Global()
@Module({
    imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),

    ],

    providers: [AuditLogService],
    controllers: [AuditLogController],
    exports: [AuditLogService],
})
export class AuditLogModule {}