
import React from 'react';
import { AlertBanner } from '@/components/ui/alert-banner';
import { PresetDataTable, tenantTablePreset } from '@/components/tables';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TenantModal } from '@/components/common/TenantModal';
import { useTenantManagement } from '@/hooks/useTenantManagement';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';
import { Trash2 } from 'lucide-react';

export const TenantsPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const {
    // Data
    tenants,
    isLoading,
    error,
    isRefreshing,
    searchQuery,

    // Modal states
    isCreateModalOpen,
    editingTenant,
    deletingTenant,

    // Actions
    setSearchQuery,
    fetchTenants,
    handleTenantSubmit,
    openCreateModal,
    closeCreateModal,
    confirmDeleteTenant,
    actionHandlers,
    retryFetch,
  } = useTenantManagement();

  // Determine permissions based on current user role
  const canEdit = [UserRole.SuperAdmin].includes(
    currentUser?.role as UserRole
  );

  const canCreate = [UserRole.SuperAdmin].includes(
    currentUser?.role as UserRole
  );

  // Get dynamic title based on user role
  const getPageTitle = () => {
    switch (currentUser?.role) {
      case UserRole.SuperAdmin:
        return 'Tenant Management';
      default:
        return 'Tenant Management';
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
        preset={tenantTablePreset}
        titleOverride={getPageTitle()}
        data={tenants}
        loading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchTenants(true)}
        isRefreshing={isRefreshing}
        onCreateNew={openCreateModal}
        canCreate={canCreate}
        getItemKey={(tenant) => tenant.id}
        actionHandlers={actionHandlers}
        className="flex-1"
      />

      {/* Create/Edit Tenant Modal */}
      <TenantModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleTenantSubmit}
        tenant={editingTenant}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingTenant}
        onOpenChange={() => deletingTenant && confirmDeleteTenant()}
        title="Delete Tenant"
        description={
          <span>
            Are you sure you want to delete{' '}
            <strong>"{deletingTenant?.name}"</strong>?
            <br /><br />
            This will permanently delete:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The complete PostgreSQL schema and all tenant data</li>
              <li>All user accounts and profiles in this tenant</li>
              <li>Domain configurations</li>
              <li>All application data and settings</li>
            </ul>
            <br />
            <strong>Note:</strong> After deletion, you can create a new tenant with the same details.
          </span>
        }
        confirmText="Delete Permanently"
        onConfirm={confirmDeleteTenant}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
      />
    </div>
  );
};
