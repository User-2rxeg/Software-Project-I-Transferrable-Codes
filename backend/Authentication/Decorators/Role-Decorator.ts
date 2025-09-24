import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../User/Model/User';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);



//
// import { SetMetadata } from '@nestjs/common';
// import { UserRole } from '../../Model/User';
//
// export const ROLES_KEY = 'roles';
// export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
