import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TempJwtGuard extends AuthGuard('temp-jwt') {}
