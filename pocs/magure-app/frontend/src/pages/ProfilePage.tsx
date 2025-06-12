import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  User, 
  Edit2, 
  Save, 
  X, 
  Mail, 
  Briefcase, 
  Building, 
  Shield,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile, 
  UserProfile, 
  UpdateProfileRequest 
} from '@/services/usersApi';
import { AvatarUpload } from '@/components/common/AvatarUpload';

interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  type?: 'text' | 'email';
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  type = 'text',
  placeholder,
  icon,
  required = false
}) => {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value, isEditing]);

  const handleSave = () => {
    if (required && !tempValue.trim()) {
      toast({
        title: "Validation Error",
        description: `${label} is required`,
        variant: "destructive",
      });
      return;
    }
    onSave(tempValue);
  };

  const handleCancel = () => {
    setTempValue(value);
    onCancel();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {label}
        </Label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            {icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {icon}
              </div>
            )}
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#B96AF7] transition-all duration-200 ${icon ? 'pl-10' : ''}`}
              style={{ fontFamily: 'Satoshi, sans-serif' }}
              autoFocus
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          {icon && (
            <div className="text-gray-400 flex-shrink-0">
              {icon}
            </div>
          )}
          <span 
            className="text-gray-900 dark:text-white flex-1" 
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {value || 'Not set'}
          </span>
        </div>
      )}
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const profileData = await getCurrentUserProfile(user.id);
      setProfile(profileData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!profile || !user?.id) return;

    setUpdating(true);
    try {
      const updateData: UpdateProfileRequest = { [field]: value };
      const updatedProfile = await updateCurrentUserProfile(user.id, updateData);
      setProfile(updatedProfile);
      setEditingField(null);
      
      toast({
        title: "Profile Updated",
        description: `Your ${field.replace('_', ' ')} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to update ${field.replace('_', ' ')}`,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'superadmin': return 'bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white border-0';
      case 'tenant_admin': return 'bg-gradient-to-r from-[#B96AF7] to-[#3077F3] text-white border-0';
      case 'tenant_user': return 'bg-gradient-to-r from-[#3077F3] to-[#41E6F8] text-white border-0';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#B96AF7]" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400">Failed to load profile data</p>
                <Button onClick={loadProfile} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Profile Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white p-8">
            <div className="flex items-center gap-6">
              <AvatarUpload
                currentAvatar={profile.avatar_url || undefined}
                userName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'}
                userId={parseInt(profile.id)}
                onUploadSuccess={(url) => setProfile(prev => prev ? { ...prev, avatar_url: url } : null)}
                onDeleteSuccess={() => setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null)}
                size="xl"
              />
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User'}
                </CardTitle>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${getRoleBadgeColor(profile.role || 'tenant_user')} px-3 py-1`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    {(profile.role || 'tenant_user').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {(profile.is_active ?? true) ? (
                    <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-300 text-red-200 bg-red-500/20">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-white/80" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  @{profile.username || 'username'}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField
                  label="First Name"
                  value={profile.first_name || ''}
                  isEditing={editingField === 'first_name'}
                  onEdit={() => setEditingField('first_name')}
                  onSave={(value) => handleFieldUpdate('first_name', value)}
                  onCancel={() => setEditingField(null)}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                <EditableField
                  label="Last Name"
                  value={profile.last_name || ''}
                  isEditing={editingField === 'last_name'}
                  onEdit={() => setEditingField('last_name')}
                  onSave={(value) => handleFieldUpdate('last_name', value)}
                  onCancel={() => setEditingField(null)}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                <EditableField
                  label="Username"
                  value={profile.username || ''}
                  isEditing={editingField === 'username'}
                  onEdit={() => setEditingField('username')}
                  onSave={(value) => handleFieldUpdate('username', value)}
                  onCancel={() => setEditingField(null)}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                <EditableField
                  label="Email Address"
                  value={profile.email || ''}
                  isEditing={editingField === 'email'}
                  onEdit={() => setEditingField('email')}
                  onSave={(value) => handleFieldUpdate('email', value)}
                  onCancel={() => setEditingField(null)}
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField
                  label="Job Title"
                  value={profile.profile?.job_title || ''}
                  isEditing={editingField === 'job_title'}
                  onEdit={() => setEditingField('job_title')}
                  onSave={(value) => handleFieldUpdate('job_title', value)}
                  onCancel={() => setEditingField(null)}
                  icon={<Briefcase className="h-4 w-4" />}
                  placeholder="e.g. Software Engineer"
                />
                
                {/* Department - Read-only for now */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    Department
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white flex-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {profile.profile?.department?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>

                {/* Custom Role - Read-only for now */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    Custom Role
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <Shield className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white flex-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      {profile.profile?.custom_role?.name || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading overlay */}
        {updating && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3 shadow-xl">
              <Loader2 className="h-5 w-5 animate-spin text-[#B96AF7]" />
              <span className="text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Updating profile...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};