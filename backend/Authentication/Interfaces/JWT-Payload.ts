import { UserRole } from '../../User/Model/User';

export interface JwtPayload {
    sub: string;   // user._id
    email: string;
    role: UserRole;
    mfa?: boolean; // used by temp token during MFA flow
}
