import { UserRole } from '../../Database/User';

export interface JwtPayload {
    sub: string;   // user._id
    email: string;
    role: UserRole;
    // Optional if you later add refresh rotation/MFA flows:
    jti?: string;
    mfa?: boolean;
}





// import { UserRole } from '../../Database/User';
//
// export interface JwtPayload {
//     sub: string; // user._id
//     email: string;
//     role: UserRole;
// }
//
//
// // export interface JwtPayload {
// //     sub: string;
// //     email: string;
// //     role: UserRole;
// //     jti?: string;     // add for refresh tokens
// //     mfa?: boolean;    // used by temp token
// // }
