import React, { useEffect, useState } from 'react';
import { createUser, CreateUserRequest, CreateUserResponse, getUsers } from '@/services/usersApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateUserModal } from '@/components/common/CreateUserModal';
import { UserRole } from '@/enums/userRole';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Edit, Trash2, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface User extends CreateUserResponse {}

interface UserManagementTableProps {
  role: UserRole;
  tenantId?: string;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ role }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await getUsers()
        setUsers(fetchedUsers.results); // handle paginated or non-paginated
      } finally {
        setLoading(false);
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'superadmin': return 'bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white border-0';
      case 'tenant_admin': return 'bg-gradient-to-r from-[#B96AF7] to-[#3077F3] text-white border-0';
      case 'tenant_user': return 'bg-gradient-to-r from-[#3077F3] to-[#41E6F8] text-white border-0';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {role === UserRole.SuperAdmin
                  ? 'Superadmin User Management'
                  : role === UserRole.TenantAdmin
                  ? 'Tenant User Management'
                  : 'User Management'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Manage users and their permissions
              </p>
            </div>
            {canCreate && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or username..."
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#B96AF7] transition-all duration-200"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
            </div>
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-6">
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateUser}
          />
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B96AF7]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>User</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>Email</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>Role</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>Status</th>
                    {canEdit() && <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit() ? 5 : 4} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                            <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              No users found
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new user'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center text-white font-semibold" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>{user.email}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getRoleBadgeColor(user.role)} px-3 py-1`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                            {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {user.is_active ? (
                            <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-gray-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Inactive</span>
                            </div>
                          )}
                        </td>
                        {canEdit() && (
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
