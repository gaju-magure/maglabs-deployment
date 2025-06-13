import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertBanner } from '@/components/ui/alert-banner';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CustomRoleModal } from '@/components/common/CustomRoleModal';
import { DepartmentModal } from '@/components/common/DepartmentModal';
import { customRoleColumns } from '@/components/tables/columns/customRoleColumns';
import { createDepartmentColumns } from '@/components/tables/columns/departmentColumns';
import { useCustomRoleManagement } from '@/hooks/useCustomRoleManagement';
import { useDepartmentManagement } from '@/hooks/useDepartmentManagement';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';
import { Trash2, Building, Shield, Palette } from 'lucide-react';
import { BrandingPanel } from '@/components/branding/BrandingPanel';

export const OrganizationPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');

  // Get users for department head selection
  const { users } = useUserManagement();

  // Custom roles management
  const {
    customRoles,
    isLoading: rolesLoading,
    error: rolesError,
    isRefreshing: rolesRefreshing,
    searchQuery: rolesSearchQuery,
    isCreateModalOpen: isCreateRoleModalOpen,
    isEditModalOpen: isEditRoleModalOpen,
    editingRole,
    deletingRole,
    setSearchQuery: setRolesSearchQuery,
    fetchCustomRoles,
    handleCreateCustomRole,
    handleUpdateCustomRole,
    openCreateModal: openCreateRoleModal,
    closeCreateModal: closeCreateRoleModal,
    closeEditModal: closeEditRoleModal,
    confirmDeleteCustomRole,
    createActionHandlers: createRoleActionHandlers,
    retryFetch: retryFetchRoles,
  } = useCustomRoleManagement();

  // Departments management
  const {
    departments,
    isLoading: deptsLoading,
    error: deptsError,
    isRefreshing: deptsRefreshing,
    searchQuery: deptsSearchQuery,
    isCreateModalOpen: isCreateDeptModalOpen,
    isEditModalOpen: isEditDeptModalOpen,
    editingDepartment,
    deletingDepartment,
    setSearchQuery: setDeptsSearchQuery,
    fetchDepartments,
    handleCreateDepartment,
    handleUpdateDepartment,
    openCreateModal: openCreateDeptModal,
    closeCreateModal: closeCreateDeptModal,
    closeEditModal: closeEditDeptModal,
    confirmDeleteDepartment,
    createActionHandlers: createDeptActionHandlers,
    retryFetch: retryFetchDepts,
  } = useDepartmentManagement();

  // Determine permissions based on current user role
  const canManage = currentUser?.role === UserRole.TenantAdmin;

  // Create action handlers with permissions
  const roleActionHandlers = createRoleActionHandlers(canManage, canManage);
  const deptActionHandlers = createDeptActionHandlers(canManage, canManage);

  // Check if user has access to this page
  if (currentUser?.role !== UserRole.TenantAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Unauthorized</h1>
          <p className="text-xl text-gray-600">You don't have permission to access organization management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Organization Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Manage your organization's custom roles, departments, and branding
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger 
                value="roles" 
                className="flex items-center gap-2"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <Shield className="w-4 h-4" />
                Custom Roles
              </TabsTrigger>
              <TabsTrigger 
                value="departments" 
                className="flex items-center gap-2"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <Building className="w-4 h-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger 
                value="branding" 
                className="flex items-center gap-2"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                <Palette className="w-4 h-4" />
                Branding
              </TabsTrigger>
            </TabsList>

            {/* Custom Roles Tab */}
            <TabsContent value="roles" className="space-y-4">
              {/* Error Banner */}
              {rolesError && (
                <AlertBanner
                  variant="destructive"
                  message={rolesError}
                  actions={[
                    {
                      label: 'Try again',
                      onClick: retryFetchRoles,
                      variant: 'outline',
                    }
                  ]}
                />
              )}

              {/* Custom Roles Table */}
              <DataTable
                columns={customRoleColumns}
                data={customRoles}
                loading={rolesLoading}
                searchQuery={rolesSearchQuery}
                onSearchChange={setRolesSearchQuery}
                searchPlaceholder="Search custom roles..."
                onRefresh={() => fetchCustomRoles(true)}
                isRefreshing={rolesRefreshing}
                onCreateNew={canManage ? openCreateRoleModal : undefined}
                canCreate={canManage}
                createButtonText="Create Custom Role"
                getItemKey={(role) => role.id.toString()}
                actionHandlers={roleActionHandlers}
                emptyStateMessage="No custom roles found"
                emptyStateDescription="Create your first custom role to get started"
              />
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4">
              {/* Error Banner */}
              {deptsError && (
                <AlertBanner
                  variant="destructive"
                  message={deptsError}
                  actions={[
                    {
                      label: 'Try again',
                      onClick: retryFetchDepts,
                      variant: 'outline',
                    }
                  ]}
                />
              )}

              {/* Departments Table */}
              <DataTable
                columns={createDepartmentColumns(users)}
                data={departments}
                loading={deptsLoading}
                searchQuery={deptsSearchQuery}
                onSearchChange={setDeptsSearchQuery}
                searchPlaceholder="Search departments..."
                onRefresh={() => fetchDepartments(true)}
                isRefreshing={deptsRefreshing}
                onCreateNew={canManage ? openCreateDeptModal : undefined}
                canCreate={canManage}
                createButtonText="Create Department"
                getItemKey={(dept) => dept.id.toString()}
                actionHandlers={deptActionHandlers}
                emptyStateMessage="No departments found"
                emptyStateDescription="Create your first department to get started"
              />
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
              <BrandingPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create/Edit Modals */}
      {/* Custom Role Modal */}
      <CustomRoleModal
        isOpen={isCreateRoleModalOpen}
        onClose={closeCreateRoleModal}
        mode="create"
        onSubmit={handleCreateCustomRole}
      />

      <CustomRoleModal
        isOpen={isEditRoleModalOpen}
        onClose={closeEditRoleModal}
        mode="edit"
        initialData={editingRole}
        onSubmit={handleUpdateCustomRole}
      />

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={closeCreateDeptModal}
        mode="create"
        onSubmit={handleCreateDepartment}
        departments={departments}
        users={users}
      />

      <DepartmentModal
        isOpen={isEditDeptModalOpen}
        onClose={closeEditDeptModal}
        mode="edit"
        initialData={editingDepartment}
        onSubmit={handleUpdateDepartment}
        departments={departments}
        users={users}
      />

      {/* Delete Confirmation Dialogs */}
      {/* Custom Role Delete Dialog */}
      <ConfirmDialog
        open={!!deletingRole}
        onOpenChange={() => deletingRole && confirmDeleteCustomRole()}
        title="Delete Custom Role"
        description={
          <span>
            Are you sure you want to delete{' '}
            <strong>"{deletingRole?.name}"</strong>?
            This action cannot be undone and may affect users assigned to this role.
          </span>
        }
        confirmText="Delete"
        onConfirm={confirmDeleteCustomRole}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
      />

      {/* Department Delete Dialog */}
      <ConfirmDialog
        open={!!deletingDepartment}
        onOpenChange={() => deletingDepartment && confirmDeleteDepartment()}
        title="Delete Department"
        description={
          <span>
            Are you sure you want to delete{' '}
            <strong>"{deletingDepartment?.name}"</strong>?
            This action cannot be undone and may affect users in this department.
          </span>
        }
        confirmText="Delete"
        onConfirm={confirmDeleteDepartment}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
      />
    </div>
  );
};