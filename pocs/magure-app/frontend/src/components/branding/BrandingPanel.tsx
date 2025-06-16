import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertBanner } from '@/components/ui/alert-banner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Image, Settings, Sparkles } from 'lucide-react';
import { useBrandingManagement } from '@/hooks/useBrandingManagement';

export const BrandingPanel: React.FC = () => {
  const {
    branding,
    isLoading,
    error,
    templates,
    isTemplatesLoading,
    templatesError,
    recommendations,
    handleApplyTemplate,
    isApplyingTemplate,
    handleResetToDefault,
    retryFetchBranding,
    retryFetchTemplates,
  } = useBrandingManagement();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <AlertBanner
          variant="destructive"
          message={error}
          actions={[
            {
              label: 'Try again',
              onClick: retryFetchBranding,
              variant: 'outline',
            }
          ]}
        />
      )}

      {/* Templates Error Banner */}
      {templatesError && (
        <AlertBanner
          variant="destructive"
          message={`Templates: ${templatesError}`}
          actions={[
            {
              label: 'Retry templates',
              onClick: retryFetchTemplates,
              variant: 'outline',
            }
          ]}
        />
      )}

      {/* Current Branding Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Current Branding
            </CardTitle>
            {branding && (
              <Badge variant="outline">
                Version {branding.version_number}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {branding ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Template Source</p>
                  <p className="text-lg">
                    {branding.template_source?.template_name || 'Custom Configuration'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Customization Level</p>
                  <Badge variant="secondary">
                    {branding.customization_level.charAt(0).toUpperCase() + branding.customization_level.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetToDefault}
                  disabled={isApplyingTemplate}
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No branding configuration found.</p>
          )}
        </CardContent>
      </Card>

      {/* Branding Management Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Assets
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {isTemplatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommended for You</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {recommendations.map((template) => (
                      <TemplateCard
                        key={template.template_id}
                        template={template}
                        onApply={() => handleApplyTemplate(template.template_id)}
                        isApplying={isApplyingTemplate}
                        isRecommended={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Templates */}
              <div>
                <h3 className="text-lg font-semibold mb-3">All Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.template_id}
                      template={template}
                      onApply={() => handleApplyTemplate(template.template_id)}
                      isApplying={isApplyingTemplate}
                      isRecommended={false}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  Color picker and palette customization coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  Logo and asset management coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TemplateCardProps {
  template: any;
  onApply: () => void;
  isApplying: boolean;
  isRecommended: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onApply, 
  isApplying, 
  isRecommended 
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative">
        {template.preview_image_url ? (
          <img 
            src={template.preview_image_url} 
            alt={template.template_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {isRecommended && (
          <Badge className="absolute top-2 right-2 bg-blue-500">
            Recommended
          </Badge>
        )}
        {template.is_default && (
          <Badge className="absolute top-2 left-2 bg-green-500">
            Default
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-1">{template.template_name}</h4>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.template_description}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {template.template_category}
          </Badge>
          <Button 
            size="sm" 
            onClick={onApply}
            disabled={isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};