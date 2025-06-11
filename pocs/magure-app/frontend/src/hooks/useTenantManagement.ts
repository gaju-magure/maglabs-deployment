import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getTenants, 
  createTenant, 
  updateTenant, 
  deleteTenant,
  sendOnboardingInvitation,
  type Tenant 
} from '@/services/tenantsApi';
import { TenantFormData } from '@/components/common/TenantModal';

export interface ExtendedTenant extends Tenant {
  status: 'active' | 'inactive';
}

export const useTenantManagement = () => {
  // State management
  const [tenants, setTenants] = useState<ExtendedTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<ExtendedTenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<ExtendedTenant | null>(null);

  // Fetch tenants function
  const fetchTenants = async (showRefreshIndicator = false) => {
    try {
      setError(null);
      
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const tenantsData = await getTenants();
      const extendedTenants = tenantsData.map(tenant => ({
        ...tenant,
        status: tenant.status || 'active',
        // Ensure onboarding fields are preserved
        onboarding_status: tenant.onboarding_status || 'pending',
        onboarding_progress: tenant.onboarding_progress,
        admin_email: tenant.admin_email
      }));
      
      setTenants(extendedTenants);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tenants';
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
    fetchTenants();
  }, []);

  // Auto-refresh for tenants with in-progress onboarding
  useEffect(() => {
    const inProgressTenants = tenants.filter(t => t.onboarding_status === 'in_progress');
    
    if (inProgressTenants.length > 0) {
      const refreshInterval = setInterval(() => {
        fetchTenants(true);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [tenants]);

  // Handle tenant form submission (create or edit)
  const handleTenantSubmit = async (formData: TenantFormData) => {
    if (editingTenant) {
      // Edit mode
      try {
        await updateTenant(editingTenant.id, {
          name: formData.name,
          domain_prefix: formData.primaryDomain,
        });
        
        setTenants(tenants.map(t => 
          t.id === editingTenant.id 
            ? { 
                ...t, 
                name: formData.name,
                primary_domain: formData.primaryDomain,
                status: formData.status,
                updated_at: new Date().toISOString() 
              }
            : t
        ));
        
        toast({
          title: "Success",
          description: `Tenant "${formData.name}" updated successfully`,
        });
        
        closeCreateModal();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    } else {
      // Create mode
      try {
        await createTenant({
          name: formData.name,
          domain_prefix: formData.primaryDomain,
          admin_email: formData.adminEmail!,
          status: formData.status,
        });
        
        toast({
          title: "Success",
          description: `Tenant "${formData.name}" created successfully`,
        });
        
        fetchTenants(true);
        closeCreateModal();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create tenant';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  // Handle edit tenant
  const handleEditTenant = (tenant: ExtendedTenant) => {
    setEditingTenant(tenant);
    setIsCreateModalOpen(true);
  };

  // Handle delete tenant
  const handleDeleteTenant = (tenant: ExtendedTenant) => {
    setDeletingTenant(tenant);
  };

  // Handle send onboarding invitation
  const handleSendInvitation = async (tenant: ExtendedTenant) => {
    try {
      const result = await sendOnboardingInvitation(tenant.id);
      
      const actionText = result.is_resend ? 'resent' : 'sent';
      
      toast({
        title: "Success",
        description: result.email_sent 
          ? `Onboarding invitation ${actionText} to ${result.admin_email || tenant.admin_email || 'tenant admin'}`
          : `Onboarding invitation prepared but email delivery failed. ${result.token ? 'Manual token: ' + result.token : ''}`,
        variant: result.email_sent ? "default" : "destructive"
      });
      
      // Refresh the tenant data to get updated onboarding status
      fetchTenants(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Confirm delete tenant
  const confirmDeleteTenant = async () => {
    if (deletingTenant) {
      try {
        const result = await deleteTenant(deletingTenant.id);
        
        setTenants(tenants.filter(t => t.id !== deletingTenant.id));
        
        toast({
          title: "Success", 
          description: result.message,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeletingTenant(null);
      }
    }
  };

  // Modal controls
  const openCreateModal = () => {
    setEditingTenant(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingTenant(null);
  };

  // Filtered data
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.primary_domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.admin_email && tenant.admin_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Action handlers for table
  const actionHandlers = {
    onEdit: handleEditTenant,
    onDelete: handleDeleteTenant,
    onSendInvitation: handleSendInvitation,
  };

  return {
    // Data
    tenants: filteredTenants,
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
    
    // Retry action for error banner
    retryFetch: () => fetchTenants(),
  };
};