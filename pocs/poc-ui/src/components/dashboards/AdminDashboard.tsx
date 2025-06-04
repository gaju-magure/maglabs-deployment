
import React, { useState } from 'react';
import { Users, Settings, BarChart3, ToggleLeft, Palette, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { UserManagement } from '@/components/admin/UserManagement';

export const AdminDashboard = () => {
  const [tenantSettings, setTenantSettings] = useState({
    gamificationEnabled: true,
    contentWallEnabled: true,
    aiScoringEnabled: true,
    collaborationEnabled: true,
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6'
  });

  const [aiWeights, setAiWeights] = useState({
    clarity: 30,
    value: 35,
    complexity: 20,
    feasibility: 15
  });

  const handleSettingChange = (setting: string, value: boolean) => {
    setTenantSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleWeightChange = (metric: string, value: number[]) => {
    setAiWeights(prev => ({
      ...prev,
      [metric]: value[0]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Administration</h1>
          <p className="text-gray-600 mt-1">Manage your organization's innovation platform</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          Save All Changes
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">1,247</p>
                <p className="text-xs text-blue-600 mt-1">+23 this month</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active Ideas</p>
                <p className="text-2xl font-bold text-green-900">342</p>
                <p className="text-xs text-green-600 mt-1">85% completion rate</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Engagement Rate</p>
                <p className="text-2xl font-bold text-purple-900">94%</p>
                <p className="text-xs text-purple-600 mt-1">Daily active users</p>
              </div>
              <ToggleLeft className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">AI Accuracy</p>
                <p className="text-2xl font-bold text-orange-900">96.3%</p>
                <p className="text-xs text-orange-600 mt-1">Scoring precision</p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenant-settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tenant-settings">Tenant Settings</TabsTrigger>
          <TabsTrigger value="ai-configuration">AI Configuration</TabsTrigger>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tenant-settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ToggleLeft className="mr-2 h-5 w-5" />
                  Feature Toggles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gamification" className="text-base font-medium">
                      Gamification System
                    </Label>
                    <p className="text-sm text-gray-500">Enable points, badges, and leaderboards</p>
                  </div>
                  <Switch
                    id="gamification"
                    checked={tenantSettings.gamificationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('gamificationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="content-wall" className="text-base font-medium">
                      Content Wall
                    </Label>
                    <p className="text-sm text-gray-500">Allow users to view and interact with peer ideas</p>
                  </div>
                  <Switch
                    id="content-wall"
                    checked={tenantSettings.contentWallEnabled}
                    onCheckedChange={(checked) => handleSettingChange('contentWallEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-scoring" className="text-base font-medium">
                      AI Scoring
                    </Label>
                    <p className="text-sm text-gray-500">Enable automatic AI-powered idea evaluation</p>
                  </div>
                  <Switch
                    id="ai-scoring"
                    checked={tenantSettings.aiScoringEnabled}
                    onCheckedChange={(checked) => handleSettingChange('aiScoringEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="collaboration" className="text-base font-medium">
                      Collaboration Tools
                    </Label>
                    <p className="text-sm text-gray-500">Enable comments, upvotes, and team features</p>
                  </div>
                  <Switch
                    id="collaboration"
                    checked={tenantSettings.collaborationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('collaborationEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Branding Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="primary-color" className="text-base font-medium">
                    Primary Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={tenantSettings.primaryColor}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tenantSettings.primaryColor}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary-color" className="text-base font-medium">
                    Secondary Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={tenantSettings.secondaryColor}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={tenantSettings.secondaryColor}
                      onChange={(e) => setTenantSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Logo Upload</Label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
                        <Button variant="outline" size="sm">
                          Upload Logo
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG up to 2MB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                AI Scoring Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">Clarity Weight</Label>
                  <div className="mt-2">
                    <Slider
                      value={[aiWeights.clarity]}
                      onValueChange={(value) => handleWeightChange('clarity', value)}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium">{aiWeights.clarity}%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Value Weight</Label>
                  <div className="mt-2">
                    <Slider
                      value={[aiWeights.value]}
                      onValueChange={(value) => handleWeightChange('value', value)}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium">{aiWeights.value}%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Complexity Weight</Label>
                  <div className="mt-2">
                    <Slider
                      value={[aiWeights.complexity]}
                      onValueChange={(value) => handleWeightChange('complexity', value)}
                      max={40}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium">{aiWeights.complexity}%</span>
                      <span>40%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Feasibility Weight</Label>
                  <div className="mt-2">
                    <Slider
                      value={[aiWeights.feasibility]}
                      onValueChange={(value) => handleWeightChange('feasibility', value)}
                      max={30}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium">{aiWeights.feasibility}%</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Weight Distribution</h4>
                <p className="text-sm text-blue-800">
                  Total: {Object.values(aiWeights).reduce((sum, weight) => sum + weight, 0)}% 
                  {Object.values(aiWeights).reduce((sum, weight) => sum + weight, 0) !== 100 && 
                    " (Should equal 100%)"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-management">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
