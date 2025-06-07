
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenant: {
    name: string;
    schemaName: string;
    primaryDomain: string;
    adminEmail: string;
    adminPassword: string;
    status: 'active' | 'inactive';
  }) => void;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    schemaName: '',
    primaryDomain: '',
    adminEmail: '',
    adminPassword: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        name: formData.name,
        schemaName: formData.schemaName,
        primaryDomain: formData.primaryDomain,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        status: formData.status,
      });
      
      setFormData({
        name: '',
        schemaName: '',
        primaryDomain: '',
        adminEmail: '',
        adminPassword: '',
        status: 'active',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSchemaName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      schemaName: generateSchemaName(name),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Acme Corp"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="schemaName">Schema Name</Label>
            <Input
              id="schemaName"
              value={formData.schemaName}
              onChange={(e) => setFormData({ ...formData, schemaName: e.target.value })}
              placeholder="e.g., acme_corp"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Domain</Label>
            <Input
              id="primaryDomain"
              value={formData.primaryDomain}
              onChange={(e) => setFormData({ ...formData, primaryDomain: e.target.value })}
              placeholder="e.g., acme.example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              placeholder="admin@acme.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin Password</Label>
            <Input
              id="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              placeholder="Password for admin user"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => 
              setFormData({ ...formData, status: value })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
