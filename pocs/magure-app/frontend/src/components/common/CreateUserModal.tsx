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
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/enums/userRole';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    job_title?: string;
    phone_number?: string;
    department_id?: number;
    custom_role_id?: number;
  }) => void;
  departments?: Array<{ id: number; name: string }>;
  customRoles?: Array<{ id: number; name: string }>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments = [],
  customRoles = [],
}) => {
  const { user: currentUser } = useAuth();
  
  // Show profile fields only for tenant admins, not for superadmins
  const showProfileFields = currentUser?.role === UserRole.TenantAdmin;
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '',
    job_title: '',
    phone_number: '',
    department_id: undefined as number | undefined,
    custom_role_id: undefined as number | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Only include profile fields if user is tenant admin
      const submitData = showProfileFields 
        ? formData 
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
          };
      
      await onSubmit(submitData);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: '',
        job_title: '',
        phone_number: '',
        department_id: undefined,
        custom_role_id: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl" style={{ fontFamily: 'Satoshi, sans-serif' }}>Create New User</DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>Add a new user to the system</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" style={{ fontFamily: 'Satoshi, sans-serif' }}>First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" style={{ fontFamily: 'Satoshi, sans-serif' }}>Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username" style={{ fontFamily: 'Satoshi, sans-serif' }}>Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="johndoe"
              required
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" style={{ fontFamily: 'Satoshi, sans-serif' }}>Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              required
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" style={{ fontFamily: 'Satoshi, sans-serif' }}>Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" style={{ fontFamily: 'Satoshi, sans-serif' }}>User Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
              <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="superadmin" style={{ fontFamily: 'Satoshi, sans-serif' }}>Super Admin</SelectItem>
                <SelectItem value="tenant_admin" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tenant Admin</SelectItem>
                <SelectItem value="tenant_user" style={{ fontFamily: 'Satoshi, sans-serif' }}>Tenant User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {showProfileFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="job_title" style={{ fontFamily: 'Satoshi, sans-serif' }}>Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="Software Engineer"
                  className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number" style={{ fontFamily: 'Satoshi, sans-serif' }}>Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                />
              </div>
              
              {departments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="department" style={{ fontFamily: 'Satoshi, sans-serif' }}>Department</Label>
                  <Select 
                    value={formData.department_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, department_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="" style={{ fontFamily: 'Satoshi, sans-serif' }}>No Department</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {customRoles.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="custom_role" style={{ fontFamily: 'Satoshi, sans-serif' }}>Custom Role</Label>
                  <Select 
                    value={formData.custom_role_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, custom_role_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      <SelectValue placeholder="Select custom role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="" style={{ fontFamily: 'Satoshi, sans-serif' }}>No Custom Role</SelectItem>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              className="rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
