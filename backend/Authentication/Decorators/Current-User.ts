import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../Interfaces/JWT-Payload.Interface';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as JwtPayload | undefined; // set by JwtStrategy / guards
    },
);

// export const CurrentUser = createParamDecorator(
//     (data: unknown, ctx: ExecutionContext) => {
//         const request = ctx.switchToHttp().getRequest();
//         return request.user; // Set by JwtStrategy or AuthGuard
//     },
// );
