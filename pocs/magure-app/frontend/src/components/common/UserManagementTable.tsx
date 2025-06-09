import React, { useEffect, useState } from 'react';
import { createUser, CreateUserRequest, CreateUserResponse, getUsers } from '@/services/usersApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateUserModal } from '@/components/common/CreateUserModal';
import { UserRole } from '@/enums/userRole';
import { useAuth } from '@/contexts/AuthContext';

interface User extends CreateUserResponse {}

interface UserManagementTableProps {
  role: UserRole;
  tenantId?: string;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ role }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers.results); // handle paginated or non-paginated
      } finally {
      }
    };
    fetchUsers();
  }, []);

  const handleCreateUser = async (user: CreateUserRequest) => {
    try {
      const newUser = await createUser(user);
      setUsers([...(users || []), newUser]);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert('Failed to create user');
    }
  };

  // Role-based columns and actions
  const canEdit = () => {
    const { user } = useAuth();
    return [UserRole.SuperAdmin, UserRole.TenantAdmin].includes(user.role as UserRole);
  }

  const canCreate = role === UserRole.SuperAdmin || role === UserRole.TenantAdmin;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {role === UserRole.SuperAdmin
            ? 'Superadmin User Management'
            : role === UserRole.TenantAdmin
            ? 'Tenant User Management'
            : 'User Management'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canCreate && (
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create User
            </Button>
          </div>
        )}
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
        />
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Username</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">First Name</th>
              <th className="border px-2 py-1">Last Name</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Active</th>
              {canEdit() && <th className="border px-2 py-1">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-2 py-1">{user.username}</td>
                <td className="border px-2 py-1">{user.email}</td>
                <td className="border px-2 py-1">{user.first_name}</td>
                <td className="border px-2 py-1">{user.last_name}</td>
                <td className="border px-2 py-1">{user.role}</td>
                <td className="border px-2 py-1">{user.is_active ? 'Yes' : 'No'}</td>
                {canEdit() && (
                  <td className="border px-2 py-1">
                    {/* Edit and delete buttons can be added here */}
                    <Button size="sm" variant="outline" className="mr-2">Edit</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
