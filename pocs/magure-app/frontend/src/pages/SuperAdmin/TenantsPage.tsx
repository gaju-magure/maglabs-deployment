
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { CreateTenantModal } from '@/components/SuperAdmin/CreateTenantModal';
import { EditTenantModal } from '@/components/SuperAdmin/EditTenantModal';
import { getTenants, createTenant, type Tenant } from '@/services/tenantsApi';
import { toast } from '@/hooks/use-toast';

interface ExtendedTenant extends Tenant {
  status: 'active' | 'inactive';
}

export const TenantsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<ExtendedTenant | null>(null);
  const [tenants, setTenants] = useState<ExtendedTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const tenantsData = await getTenants();
      // Add status field for UI compatibility
      const extendedTenants = tenantsData.map(tenant => ({
        ...tenant,
        status: 'active' as const
      }));
      setTenants(extendedTenants);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (newTenant: {
    name: string;
    schemaName: string;
    primaryDomain: string;
    adminEmail: string;
    adminPassword: string;
    status: 'active' | 'inactive';
  }) => {
    try {
      await createTenant({
        name: newTenant.name,
        schema_name: newTenant.schemaName,
        domain: newTenant.primaryDomain,
        admin_email: newTenant.adminEmail,
        admin_password: newTenant.adminPassword,
      });
      
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
      
      setIsCreateModalOpen(false);
      fetchTenants(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive",
      });
    }
  };

  const handleEditTenant = (updatedTenant: ExtendedTenant) => {
    // For now, just update local state since the API doesn't have an update endpoint
    setTenants(tenants.map(t => 
      t.id === updatedTenant.id 
        ? { ...updatedTenant, updated_at: new Date().toISOString() }
        : t
    ));
    setEditingTenant(null);
    
    toast({
      title: "Info",
      description: "Tenant edit functionality pending API implementation",
    });
  };

  const handleDeleteTenant = (id: number) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      // For now, just update local state since the API doesn't have a delete endpoint
      setTenants(tenants.filter(t => t.id !== id));
      
      toast({
        title: "Info", 
        description: "Tenant delete functionality pending API implementation",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Schema Name</TableHead>
                <TableHead>Primary Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.id}</TableCell>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell className="font-mono text-sm">{tenant.schema_name}</TableCell>
                  <TableCell>{tenant.primary_domain}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(tenant.created_at)}</TableCell>
                  <TableCell>{formatDate(tenant.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTenant(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTenant}
      />

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSubmit={handleEditTenant}
        />
      )}
    </div>
  );
};
