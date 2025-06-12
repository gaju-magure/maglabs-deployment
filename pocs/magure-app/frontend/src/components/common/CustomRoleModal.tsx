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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Plus } from 'lucide-react';
import { CustomRole, CreateCustomRoleRequest, UpdateCustomRoleRequest } from '@/services/organizationApi';

interface CustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: CustomRole | null;
  onSubmit: (data: CreateCustomRoleRequest | UpdateCustomRoleRequest) => Promise<void>;
}

// Predefined permissions structure
const PERMISSION_CATEGORIES = {
  user_management: {
    label: 'User Management',
    permissions: {
      create_users: 'Create Users',
      edit_users: 'Edit Users',
      delete_users: 'Delete Users',
      view_users: 'View Users',
    },
  },
  department_management: {
    label: 'Department Management',
    permissions: {
      create_departments: 'Create Departments',
      edit_departments: 'Edit Departments',
      delete_departments: 'Delete Departments',
      view_departments: 'View Departments',
    },
  },
  role_management: {
    label: 'Role Management',
    permissions: {
      create_roles: 'Create Roles',
      edit_roles: 'Edit Roles',
      delete_roles: 'Delete Roles',
      view_roles: 'View Roles',
    },
  },
  content_management: {
    label: 'Content Management',
    permissions: {
      create_content: 'Create Content',
      edit_content: 'Edit Content',
      delete_content: 'Delete Content',
      view_content: 'View Content',
      publish_content: 'Publish Content',
    },
  },
};

export const CustomRoleModal: React.FC<CustomRoleModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    permissions: {} as Record<string, boolean>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        is_active: initialData.is_active ?? true,
        permissions: initialData.permissions as Record<string, boolean> || {},
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        permissions: {},
      });
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        permissions: formData.permissions,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: checked,
      },
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const categoryPermissions = Object.keys(PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions);
    const updatedPermissions = { ...formData.permissions };
    
    categoryPermissions.forEach(permission => {
      updatedPermissions[permission] = checked;
    });

    setFormData({
      ...formData,
      permissions: updatedPermissions,
    });
  };

  const isCategoryChecked = (category: string) => {
    const categoryPermissions = Object.keys(PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions);
    return categoryPermissions.every(permission => formData.permissions[permission]);
  };

  const isCategoryIndeterminate = (category: string) => {
    const categoryPermissions = Object.keys(PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions);
    const checkedCount = categoryPermissions.filter(permission => formData.permissions[permission]).length;
    return checkedCount > 0 && checkedCount < categoryPermissions.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3077F3] to-[#41E6F8] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {mode === 'create' ? 'Create Custom Role' : 'Edit Custom Role'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {mode === 'create' ? 'Define a new role with specific permissions' : 'Update role information and permissions'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            <div className="space-y-2">
              <Label htmlFor="name" style={{ fontFamily: 'Satoshi, sans-serif' }}>Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
                required
                disabled={isSubmitting || (mode === 'edit' && initialData?.is_system_role)}
                className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#3077F3] transition-all duration-200"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
              {mode === 'edit' && initialData?.is_system_role && (
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  System roles cannot be renamed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" style={{ fontFamily: 'Satoshi, sans-serif' }}>Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this role"
                rows={3}
                className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#3077F3] transition-all duration-200 resize-none"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active Status</Label>
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Active roles can be assigned to users
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <Label style={{ fontFamily: 'Satoshi, sans-serif' }}>Permissions</Label>
              <div className="space-y-4">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${categoryKey}`}
                        checked={isCategoryChecked(categoryKey)}
                        onCheckedChange={(checked) => handleCategoryChange(categoryKey, checked as boolean)}
                        disabled={isSubmitting}
                        {...(isCategoryIndeterminate(categoryKey) && { 'data-state': 'indeterminate' })}
                      />
                      <Label
                        htmlFor={`category-${categoryKey}`}
                        className="text-sm font-medium cursor-pointer"
                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                      >
                        {category.label}
                      </Label>
                    </div>
                    <div className="ml-6 space-y-2">
                      {Object.entries(category.permissions).map(([permissionKey, permissionLabel]) => (
                        <div key={permissionKey} className="flex items-center space-x-2">
                          <Checkbox
                            id={permissionKey}
                            checked={formData.permissions[permissionKey] || false}
                            onCheckedChange={(checked) => handlePermissionChange(permissionKey, checked as boolean)}
                            disabled={isSubmitting}
                          />
                          <Label
                            htmlFor={permissionKey}
                            className="text-sm cursor-pointer text-gray-600 dark:text-gray-400"
                            style={{ fontFamily: 'Satoshi, sans-serif' }}
                          >
                            {permissionLabel}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (mode === 'edit' && initialData?.is_system_role)}
              className="rounded-xl bg-gradient-to-r from-[#3077F3] to-[#41E6F8] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? <Plus className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  {mode === 'create' ? 'Create Role' : 'Update Role'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};