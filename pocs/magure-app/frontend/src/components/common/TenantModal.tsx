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
import { Building2, Plus } from 'lucide-react';

export interface TenantFormData {
  name: string;
  schemaName: string;
  primaryDomain: string;
  adminEmail?: string;
  adminPassword?: string;
  status: 'active' | 'inactive';
}

export interface TenantData {
  id?: number;
  name: string;
  schema_name: string;
  primary_domain: string;
  created_at?: string;
  updated_at?: string;
  status: 'active' | 'inactive';
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TenantFormData) => Promise<void>;
  tenant?: TenantData | null;
  mode?: 'create' | 'edit';
}

export const TenantModal: React.FC<TenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenant = null,
  mode = tenant ? 'edit' : 'create',
}) => {
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    schemaName: '',
    primaryDomain: '',
    adminEmail: '',
    adminPassword: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = mode === 'edit' && tenant;

  // Reset form when modal opens/closes or tenant changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: tenant.name,
          schemaName: tenant.schema_name,
          primaryDomain: tenant.primary_domain,
          adminEmail: '', // Don't populate for edit
          adminPassword: '', // Don't populate for edit
          status: tenant.status,
        });
      } else {
        setFormData({
          name: '',
          schemaName: '',
          primaryDomain: '',
          adminEmail: '',
          adminPassword: '',
          status: 'active',
        });
      }
    }
  }, [isOpen, tenant, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.schemaName.trim() || !formData.primaryDomain.trim()) {
      return;
    }
    
    if (!isEditMode && (!formData.adminEmail?.trim() || !formData.adminPassword?.trim())) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
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
      // Only auto-generate schema name in create mode
      schemaName: isEditMode ? formData.schemaName : generateSchemaName(name),
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {isEditMode ? 'Edit Tenant' : 'Create New Tenant'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {isEditMode ? 'Update tenant information' : 'Add a new tenant to the system'}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Tenant Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Acme Corp"
              required
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="schemaName" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Schema Name
            </Label>
            <Input
              id="schemaName"
              value={formData.schemaName}
              onChange={(e) => setFormData({ ...formData, schemaName: e.target.value })}
              placeholder="e.g., acme_corp"
              required
              disabled={isSubmitting || !!isEditMode}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
            {isEditMode && (
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Schema name cannot be changed after creation
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primaryDomain" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Domain
            </Label>
            <Input
              id="primaryDomain"
              value={formData.primaryDomain}
              onChange={(e) => setFormData({ ...formData, primaryDomain: e.target.value })}
              placeholder="e.g., acme.example.com"
              required
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          
          {!isEditMode && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Admin Email
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@acme.com"
                  required
                  disabled={isSubmitting}
                  className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminPassword" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Admin Password
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="status" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Status
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="active" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Active
                </SelectItem>
                <SelectItem value="inactive" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? <Building2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isEditMode ? 'Update Tenant' : 'Create Tenant'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};