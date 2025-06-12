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
import { Shield, Plus } from 'lucide-react';
import { CustomRole, CreateCustomRoleRequest, UpdateCustomRoleRequest } from '@/services/organizationApi';

interface CustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: CustomRole | null;
  onSubmit: (data: CreateCustomRoleRequest | UpdateCustomRoleRequest) => Promise<void>;
}

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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        is_active: initialData.is_active ?? true,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        is_active: true,
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
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-hidden">
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6 overflow-y-auto max-h-[60vh] scrollbar-hide px-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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

          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
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