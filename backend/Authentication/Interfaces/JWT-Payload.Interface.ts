import { UserRole } from '../../Database/User';

export interface JwtPayload {
    sub: string; // user._id
    email: string;
    role: UserRole;
}
