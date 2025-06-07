import React from 'react';
import { UserManagementTable } from '@/components/common/UserManagementTable';
import { UserRole } from '@/enums/userRole';

export const UsersPage: React.FC = () => (
  <div className="space-y-6">
    <UserManagementTable role={UserRole.SuperAdmin} />
  </div>
);
