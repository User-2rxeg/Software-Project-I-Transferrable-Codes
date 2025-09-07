
import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../Database/User';
import {ROLES_KEY} from "../Decorators/Role-Decorator";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiredRoles) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { role?: UserRole } | undefined;
        return !!user?.role && requiredRoles.includes(user.role);
    }
}

// @Injectable()
// export class RolesGuard implements CanActivate {
//     constructor(private reflector: Reflector) {}
//
//     canActivate(context: ExecutionContext): boolean {
//         const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
//             ROLES_KEY,
//             [context.getHandler(), context.getClass()],
//         );
//         if (!requiredRoles) {
//             return true; // No role restrictions
//         }
//
//         const request = context.switchToHttp().getRequest();
//         const user = request.user;
//
//         return requiredRoles.includes(user.role);
//     }
// }
