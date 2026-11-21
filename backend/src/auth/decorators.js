import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const ROLE_ADMIN = 'admin';
export const ROLE_OPERATOR = 'operator';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
