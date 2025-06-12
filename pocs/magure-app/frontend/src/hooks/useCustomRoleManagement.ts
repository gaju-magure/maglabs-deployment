import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getCustomRoles, 
  createCustomRole, 
  updateCustomRole,
  deleteCustomRole,
  duplicateCustomRole,
  type CustomRole,
  type CreateCustomRoleRequest,
  type UpdateCustomRoleRequest
} from '@/services/organizationApi';

export const useCustomRoleManagement = () => {
  // State management
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);

  // Fetch custom roles function
  const fetchCustomRoles = async (showRefreshIndicator = false) => {
    try {
      setError(null);
      
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const rolesData = await getCustomRoles();
      setCustomRoles(rolesData || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch custom roles';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchCustomRoles();
  }, []);

  // Handle create custom role
  const handleCreateCustomRole = async (roleData: CreateCustomRoleRequest) => {
    try {
      const createdRole = await createCustomRole(roleData);
      setCustomRoles([...customRoles, createdRole]);
      
      toast({
        title: "Success",
        description: `Custom role "${roleData.name}" created successfully`,
      });
      
      setIsCreateModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create custom role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle edit custom role
  const handleEditCustomRole = (role: CustomRole) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  // Handle update custom role
  const handleUpdateCustomRole = async (roleData: UpdateCustomRoleRequest) => {
    if (!editingRole) return;
    
    try {
      const updatedRole = await updateCustomRole(editingRole.id, roleData);
      
      // Update the role in the local state
      setCustomRoles(customRoles.map(role => 
        role.id === editingRole.id ? { ...role, ...updatedRole } : role
      ));
      
      toast({
        title: "Success",
        description: `Custom role "${roleData.name || editingRole.name}" updated successfully`,
      });
      
      setIsEditModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update custom role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete custom role
  const handleDeleteCustomRole = (role: CustomRole) => {
    if (role.is_system_role) {
      toast({
        title: "Cannot Delete System Role",
        description: "System roles cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    setDeletingRole(role);
  };

  // Confirm delete custom role
  const confirmDeleteCustomRole = async () => {
    if (deletingRole) {
      try {
        await deleteCustomRole(deletingRole.id);
        setCustomRoles(customRoles.filter(role => role.id !== deletingRole.id));
        
        toast({
          title: "Success",
          description: `Custom role "${deletingRole.name}" deleted successfully`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom role';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeletingRole(null);
      }
    }
  };

  // Handle duplicate custom role
  const handleDuplicateCustomRole = async (role: CustomRole) => {
    try {
      const duplicatedRole = await duplicateCustomRole(role.id);
      setCustomRoles([...customRoles, duplicatedRole]);
      
      toast({
        title: "Success",
        description: `Custom role "${role.name}" duplicated successfully`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate custom role';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Modal controls
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRole(null);
  };

  // Filtered data
  const filteredCustomRoles = customRoles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Action handlers for table
  const createActionHandlers = (canEdit: boolean, canDelete: boolean) => ({
    onEdit: canEdit ? handleEditCustomRole : undefined,
    onDelete: canDelete ? handleDeleteCustomRole : undefined,
    onDuplicate: canEdit ? handleDuplicateCustomRole : undefined,
    canEdit,
    canDelete,
    canDuplicate: canEdit,
  });

  return {
    // Data
    customRoles: filteredCustomRoles,
    isLoading,
    error,
    isRefreshing,
    searchQuery,
    
    // Modal states
    isCreateModalOpen,
    isEditModalOpen,
    editingRole,
    deletingRole,
    
    // Actions
    setSearchQuery,
    fetchCustomRoles,
    handleCreateCustomRole,
    handleUpdateCustomRole,
    handleDuplicateCustomRole,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    confirmDeleteCustomRole,
    createActionHandlers,
    
    // Retry action for error banner
    retryFetch: () => fetchCustomRoles(),
  };
};