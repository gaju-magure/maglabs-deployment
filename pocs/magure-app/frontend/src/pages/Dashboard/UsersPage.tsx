import React from 'react';
import { AlertBanner } from '@/components/ui/alert-banner';
import { PresetDataTable, userTablePreset } from '@/components/tables';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CreateUserModal } from '@/components/common/CreateUserModal';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';
import { Trash2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const {
    // Data
    users,
    isLoading,
    error,
    isRefreshing,
    searchQuery,

    // Modal states
    isCreateModalOpen,
    deletingUser,

    // Actions
    setSearchQuery,
    fetchUsers,
    handleCreateUser,
    openCreateModal,
    closeCreateModal,
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
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateUser}
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