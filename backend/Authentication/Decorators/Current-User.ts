import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {JwtPayload} from "../Interfaces/JWT-Payload";


export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as JwtPayload | undefined;
    },
);
