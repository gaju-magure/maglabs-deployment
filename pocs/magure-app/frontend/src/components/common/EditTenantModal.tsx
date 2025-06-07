
import React, { useState, useEffect } from 'react';
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

interface Tenant {
  id: number;
  name: string;
  schema_name: string;
  primary_domain: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

interface EditTenantModalProps {
  tenant: Tenant;
  onClose: () => void;
  onSubmit: (tenant: Tenant) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    schema_name: '',
    primary_domain: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    setFormData({
      name: tenant.name,
      schema_name: tenant.schema_name,
      primary_domain: tenant.primary_domain,
      status: tenant.status,
    });
  }, [tenant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...tenant,
      name: formData.name,
      schema_name: formData.schema_name,
      primary_domain: formData.primary_domain,
      status: formData.status,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="schema_name">Schema Name</Label>
            <Input
              id="schema_name"
              value={formData.schema_name}
              onChange={(e) => setFormData({ ...formData, schema_name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primary_domain">Primary Domain</Label>
            <Input
              id="primary_domain"
              value={formData.primary_domain}
              onChange={(e) => setFormData({ ...formData, primary_domain: e.target.value })}
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Tenant</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
