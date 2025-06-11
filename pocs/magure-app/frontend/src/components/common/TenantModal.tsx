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
import { AvatarUpload } from '@/components/common/AvatarUpload';

export interface TenantFormData {
  name: string;
  primaryDomain: string;
  adminEmail?: string;
  status: 'active' | 'inactive';
}

export interface TenantData {
  id?: number;
  name: string;
  primary_domain: string;
  admin_email?: string;
  created_at?: string;
  updated_at?: string;
  status: 'active' | 'inactive';
  logo_url?: string;
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
    primaryDomain: '',
    adminEmail: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant?.logo_url || null);

  const isEditMode = mode === 'edit' && tenant;

  // Reset form when modal opens/closes or tenant changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: tenant.name,
          primaryDomain: tenant.primary_domain,
          adminEmail: tenant.admin_email || '',
          status: tenant.status,
        });
        setLogoUrl(tenant.logo_url || null);
      } else {
        setFormData({
          name: '',
          primaryDomain: '',
          adminEmail: '',
          status: 'active',
        });
        setLogoUrl(null);
      }
    }
  }, [isOpen, tenant, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.primaryDomain.trim()) {
      return;
    }
    
    if (!isEditMode && !formData.adminEmail?.trim()) {
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

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] w-[95vw] sm:w-full rounded-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {isEditMode ? 'Edit Tenant' : 'Create New Tenant'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {isEditMode ? 'Update tenant information' : 'Add a new tenant to the system'}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
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

          {/* Tenant Logo Upload - only in edit mode */}
          {isEditMode && tenant?.id && (
            <div className="space-y-2">
              <Label style={{ fontFamily: 'Satoshi, sans-serif' }}>Tenant Logo</Label>
              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatar={logoUrl}
                  userName={formData.name}
                  userId={tenant.id}
                  onUploadSuccess={(url) => setLogoUrl(url)}
                  onDeleteSuccess={() => setLogoUrl(null)}
                  size="lg"
                />
              </div>
            </div>
          )}
          
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
              disabled={isSubmitting || isEditMode}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
            {isEditMode && (
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Admin email is set during onboarding
              </p>
            )}
          </div>
          
          {!isEditMode && (
            <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Admin password will be set during onboarding
            </p>
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
          
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 w-full sm:w-auto"
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