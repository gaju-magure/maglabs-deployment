import React, { useState, useEffect } from 'react';
import { AlertBanner } from '@/components/ui/alert-banner';
import { PresetDataTable, userTablePreset } from '@/components/tables';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserModal } from '@/components/common/UserModal';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';
import { getDepartments, getCustomRoles } from '@/services/organizationApi';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [customRoles, setCustomRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(false);

  const {
    // Data
    users,
    isLoading,
    error,
    isRefreshing,
    searchQuery,

    // Modal states
    isCreateModalOpen,
    isEditModalOpen,
    editingUser,
    deletingUser,

    // Actions
    setSearchQuery,
    fetchUsers,
    handleCreateUser,
    handleUpdateUser,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    confirmDeleteUser,
    createActionHandlers,
    retryFetch,
  } = useUserManagement();

  // Determine permissions based on current user role
  const canEdit = [UserRole.SuperAdmin, UserRole.TenantAdmin].includes(
    currentUser?.role as UserRole
  );

  const canCreate = [UserRole.SuperAdmin, UserRole.TenantAdmin].includes(
    currentUser?.role as UserRole
  );

  // Create action handlers with permissions
  const actionHandlers = createActionHandlers(canEdit, canEdit);

  // Fetch departments and custom roles for tenant admins
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (currentUser?.role !== UserRole.TenantAdmin) {
        return; // Only fetch for tenant admins
      }

      setIsLoadingOrgData(true);
      try {
        const [deptResponse, roleResponse] = await Promise.all([
          getDepartments(),
          getCustomRoles()
        ]);

        setDepartments(deptResponse.results?.map(dept => ({ 
          id: dept.id, 
          name: dept.name 
        })) || []);
        setCustomRoles(roleResponse.results?.map(role => ({ 
          id: role.id, 
          name: role.name 
        })) || []);
      } catch (error) {
        console.error('Failed to fetch organization data:', error);
        toast({
          title: "Warning",
          description: "Failed to load departments and custom roles",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrgData(false);
      }
    };

    fetchOrganizationData();
  }, [currentUser?.role]);

  // Get dynamic title based on user role
  const getPageTitle = () => {
    switch (currentUser?.role) {
      case UserRole.SuperAdmin:
        return 'Superadmin User Management';
      case UserRole.TenantAdmin:
        return 'Tenant User Management';
      default:
        return 'User Management';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Loading Organization Data Banner */}
      {isLoadingOrgData && currentUser?.role === UserRole.TenantAdmin && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-700 dark:text-blue-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Loading departments and custom roles...
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-6">
          <AlertBanner
            variant="destructive"
            message={error}
            actions={[
              {
                label: 'Try again',
                onClick: retryFetch,
                variant: 'outline',
              }
            ]}
          />
        </div>
      )}

      {/* Data Table */}
      <PresetDataTable
        preset={userTablePreset}
        titleOverride={getPageTitle()}
        data={users}
        loading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchUsers(true)}
        isRefreshing={isRefreshing}
        onCreateNew={openCreateModal}
        canCreate={canCreate}
        getItemKey={(user) => user.id}
        actionHandlers={actionHandlers}
        className="flex-1"
        disabled={isLoadingOrgData && currentUser?.role === UserRole.TenantAdmin}
      />

      {/* Create User Modal */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        mode="create"
        onSubmit={handleCreateUser}
        departments={departments}
        customRoles={customRoles}
      />

      {/* Edit User Modal */}
      <UserModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        mode="edit"
        initialData={editingUser}
        onSubmit={handleUpdateUser}
        departments={departments}
        customRoles={customRoles}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={() => deletingUser && confirmDeleteUser()}
        title="Delete User"
        description={
          <span>
            Are you sure you want to delete{' '}
            <strong>"{deletingUser?.username}"</strong>?
            This action cannot be undone and will remove all user data.
          </span>
        }
        confirmText="Delete"
        onConfirm={confirmDeleteUser}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
      />
    </div>
  );
};