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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building, Plus } from 'lucide-react';
import { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from '@/services/organizationApi';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: Department | null;
  onSubmit: (data: CreateDepartmentRequest | UpdateDepartmentRequest) => Promise<void>;
  departments?: Department[]; // For parent department selection
  users?: Array<{ id: number; first_name: string; last_name: string; email: string }>; // For department head selection
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  departments = [],
  users = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_department: undefined as number | undefined,
    department_head: undefined as number | undefined,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out current department and its children from parent options
  const getAvailableParentDepartments = () => {
    if (mode === 'create' || !initialData) {
      return departments;
    }
    
    // In edit mode, filter out self and children to prevent circular references
    const currentId = initialData.id;
    const childIds = new Set<number>();
    
    // Recursive function to find all children
    const findChildren = (parentId: number) => {
      departments.forEach(dept => {
        if (dept.parent_department === parentId) {
          childIds.add(dept.id);
          findChildren(dept.id);
        }
      });
    };
    
    findChildren(currentId);
    
    return departments.filter(dept => 
      dept.id !== currentId && !childIds.has(dept.id)
    );
  };

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        parent_department: initialData.parent_department || undefined,
        department_head: initialData.department_head || undefined,
        is_active: initialData.is_active ?? true,
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        parent_department: undefined,
        department_head: undefined,
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
        parent_department: formData.parent_department,
        department_head: formData.department_head,
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
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#B96AF7] to-[#FDA052] flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {mode === 'create' ? 'Create Department' : 'Edit Department'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                {mode === 'create' ? 'Add a new department to your organization' : 'Update department information'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6 overflow-y-auto max-h-[60vh] scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <div className="space-y-2">
            <Label htmlFor="name" style={{ fontFamily: 'Satoshi, sans-serif' }}>Department Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Engineering"
              required
              disabled={isSubmitting}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ fontFamily: 'Satoshi, sans-serif' }}>Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the department's purpose and responsibilities"
              rows={3}
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200 resize-none"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>

          {getAvailableParentDepartments().length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_department" style={{ fontFamily: 'Satoshi, sans-serif' }}>Parent Department</Label>
              <Select
                value={formData.parent_department?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, parent_department: value ? parseInt(value) : undefined })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    No Parent (Top Level)
                  </SelectItem>
                  {getAvailableParentDepartments().map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department_head" style={{ fontFamily: 'Satoshi, sans-serif' }}>Department Head</Label>
              <Select
                value={formData.department_head?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, department_head: value ? parseInt(value) : undefined })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <SelectValue placeholder="Select department head (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    No Department Head
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="is_active" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active Status</Label>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Active departments are visible and functional
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
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#B96AF7] to-[#FDA052] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? <Plus className="w-4 h-4 mr-2" /> : <Building className="w-4 h-4 mr-2" />}
                  {mode === 'create' ? 'Create Department' : 'Update Department'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};