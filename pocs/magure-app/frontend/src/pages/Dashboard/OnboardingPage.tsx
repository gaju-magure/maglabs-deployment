
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Palette } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const [settings, setSettings] = useState({
    autoCreateSchema: true,
    defaultRoles: true,
    emailTemplates: true,
    brandColors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981'
    },
    welcomeMessage: 'Welcome to your new workspace! We are excited to have you on board.',
    defaultPermissions: {
      canCreateContent: true,
      canInviteUsers: false,
      canManageSettings: false
    }
  });

  const handleSave = () => {
    // In a real app, save to backend
    toast({
      title: "Success",
      description: "Onboarding settings have been saved successfully!",
    });
  };

  const handleColorChange = (colorType: string, value: string) => {
    setSettings({
      ...settings,
      brandColors: {
        ...settings.brandColors,
        [colorType]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Customize Onboarding</h1>
      </div>

      <div className="grid gap-6">
        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Tenant Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoSchema">Auto-create database schema</Label>
              <Switch
                id="autoSchema"
                checked={settings.autoCreateSchema}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, autoCreateSchema: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="defaultRoles">Setup default user roles</Label>
              <Switch
                id="defaultRoles"
                checked={settings.defaultRoles}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, defaultRoles: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="emailTemplates">Enable default email templates</Label>
              <Switch
                id="emailTemplates"
                checked={settings.emailTemplates}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, emailTemplates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary"
                    type="color"
                    value={settings.brandColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-10 p-1 rounded"
                  />
                  <Input
                    value={settings.brandColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary"
                    type="color"
                    value={settings.brandColors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-10 p-1 rounded"
                  />
                  <Input
                    value={settings.brandColors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    placeholder="#6b7280"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accent"
                    type="color"
                    value={settings.brandColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-12 h-10 p-1 rounded"
                  />
                  <Input
                    value={settings.brandColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Default welcome message for new tenants</Label>
              <Textarea
                id="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                rows={4}
                placeholder="Enter the welcome message..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Default User Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="canCreate">Can create content by default</Label>
              <Switch
                id="canCreate"
                checked={settings.defaultPermissions.canCreateContent}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings,
                    defaultPermissions: {
                      ...settings.defaultPermissions,
                      canCreateContent: checked
                    }
                  })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="canInvite">Can invite users by default</Label>
              <Switch
                id="canInvite"
                checked={settings.defaultPermissions.canInviteUsers}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings,
                    defaultPermissions: {
                      ...settings.defaultPermissions,
                      canInviteUsers: checked
                    }
                  })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="canManage">Can manage settings by default</Label>
              <Switch
                id="canManage"
                checked={settings.defaultPermissions.canManageSettings}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings,
                    defaultPermissions: {
                      ...settings.defaultPermissions,
                      canManageSettings: checked
                    }
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
