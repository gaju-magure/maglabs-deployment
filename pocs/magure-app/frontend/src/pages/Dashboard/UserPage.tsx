import React from 'react';
import { UserManagementTable } from '@/components/common/UserManagementTable';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <UserManagementTable role={user.role as UserRole} />
    </div>
  );
};