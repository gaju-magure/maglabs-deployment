export enum UserRole {
  SuperAdmin = 'superadmin',
  TenantAdmin = 'tenant_admin',
  TenantUser = 'tenant_user',
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'Super Admin',
  [UserRole.TenantAdmin]: 'Tenant Admin',
  [UserRole.TenantUser]: 'Tenant User',
};
