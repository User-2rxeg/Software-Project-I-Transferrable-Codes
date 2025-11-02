// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { UserRole } from '../../User/Model/User';
// import {ROLES_KEY} from "../Decorators/Roles-Decorator";
//
//
// @Injectable()
// export class RolesGuard implements CanActivate {
//     constructor(private reflector: Reflector) {}
//
//     canActivate(context: ExecutionContext): boolean {
//         const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
//             ROLES_KEY,
//             [context.getHandler(), context.getClass()],
//         );
//         if (!requiredRoles) return true;
//
//         const req = context.switchToHttp().getRequest();
//         const user = req.user as { role?: UserRole } | undefined;
//         return !!user?.role && requiredRoles.includes(user.role);
//     }
// }


import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../User/Model/User';
import { ROLES_KEY } from '../Decorators/Roles-Decorator';
import { AuditLogService } from '../../Audit-Log/Module/Audit-Log.Service';
import { Logs} from "../../Audit-Log/Model/Logs";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly audit: AuditLogService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No roles required -> allow
        if (!requiredRoles) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { sub?: string; role?: UserRole } | undefined;

        if (!user?.role) {
            await this.audit.log(Logs.UNAUTHORIZED_ACCESS, undefined, {
                reason: 'RBAC_DENIED',
            }).catch(() => {});
            return false;
        }
        const allowed = requiredRoles.includes(user.role);

        if (!allowed) {
            await this.audit.log(Logs.UNAUTHORIZED_ACCESS, user.sub, {
                userRole: user.role,
                requiredRoles,
                reason: 'FORBIDDEN_ROLE',
            }).catch(() => {});
        }

        return allowed;
    }
}
