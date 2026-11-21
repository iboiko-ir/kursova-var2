import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const ROLE_ADMIN = 'admin';
export const ROLE_OPERATOR = 'operator';

// Routes are protected by default. This marks a public route.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// This limits a route to the listed roles.
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
