import { useState, useEffect, useCallback } from 'react';
import {
  getBranding,
  updateBranding,
  applyTemplate,
  resetToDefault,
  getThemeTemplates,
  getTemplateRecommendations,
  getAssets,
  uploadAsset,
  deleteAsset,
  handleApiError,
  type TenantBranding,
  type ThemeTemplate,
  type TenantAsset,
  type BrandingUpdateData,
} from '@/services/brandingApi';

export const useBrandingManagement = () => {
  // Branding state
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [isLoading, setBrandingLoading] = useState(false);
  const [error, setBrandingError] = useState<string | null>(null);
  const [isRefreshing, setBrandingRefreshing] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [isTemplatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ThemeTemplate[]>([]);

  // Assets state
  const [assets, setAssets] = useState<TenantAsset[]>([]);
  const [isAssetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  // UI state
  const [isApplyingTemplate, setApplyingTemplate] = useState(false);
  const [isUploading, setUploading] = useState(false);

  // Fetch branding configuration
  const fetchBranding = useCallback(async (refresh: boolean = false) => {
    if (refresh) {
      setBrandingRefreshing(true);
    } else {
      setBrandingLoading(true);
    }
    setBrandingError(null);

    try {
      const brandingData = await getBranding();
      setBranding(brandingData);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setBrandingError(errorMessage);
    } finally {
      setBrandingLoading(false);
      setBrandingRefreshing(false);
    }
  }, []);

  // Fetch theme templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);

    try {
      const templatesData = await getThemeTemplates();
      setTemplates(templatesData);

      // Also fetch recommendations
      const recommendationsData = await getTemplateRecommendations();
      setRecommendations(recommendationsData.recommendations);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setTemplatesError(errorMessage);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setAssetsLoading(true);
    setAssetsError(null);

    try {
      const assetsData = await getAssets();
      setAssets(assetsData);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setAssetsError(errorMessage);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  // Update branding
  const handleUpdateBranding = useCallback(async (data: BrandingUpdateData): Promise<boolean> => {
    setBrandingLoading(true);
    setBrandingError(null);

    try {
      const updatedBranding = await updateBranding(data);
      setBranding(updatedBranding);
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setBrandingError(errorMessage);
      return false;
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  // Apply template
  const handleApplyTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setApplyingTemplate(true);
    setBrandingError(null);

    try {
      const result = await applyTemplate(templateId);
      setBranding(result.branding);
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setBrandingError(errorMessage);
      return false;
    } finally {
      setApplyingTemplate(false);
    }
  }, []);

  // Reset to default
  const handleResetToDefault = useCallback(async (): Promise<boolean> => {
    setApplyingTemplate(true);
    setBrandingError(null);

    try {
      const result = await resetToDefault();
      setBranding(result.branding);
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setBrandingError(errorMessage);
      return false;
    } finally {
      setApplyingTemplate(false);
    }
  }, []);

  // Upload asset
  const handleUploadAsset = useCallback(async (
    file: File, 
    assetType: string, 
    assetCategory: string = 'core'
  ): Promise<boolean> => {
    setUploading(true);
    setAssetsError(null);

    try {
      const newAsset = await uploadAsset(file, assetType, assetCategory);
      setAssets(prev => [...prev, newAsset]);
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setAssetsError(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete asset
  const handleDeleteAsset = useCallback(async (assetId: string): Promise<boolean> => {
    setAssetsError(null);

    try {
      await deleteAsset(assetId);
      setAssets(prev => prev.filter(asset => asset.asset_id !== assetId));
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setAssetsError(errorMessage);
      return false;
    }
  }, []);

  // Retry functions
  const retryFetchBranding = useCallback(() => {
    fetchBranding(true);
  }, [fetchBranding]);

  const retryFetchTemplates = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const retryFetchAssets = useCallback(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Load initial data
  useEffect(() => {
    fetchBranding();
    fetchTemplates();
    fetchAssets();
  }, [fetchBranding, fetchTemplates, fetchAssets]);

  return {
    // Branding state
    branding,
    isLoading,
    error,
    isRefreshing,

    // Templates state
    templates,
    isTemplatesLoading,
    templatesError,
    recommendations,

    // Assets state
    assets,
    isAssetsLoading,
    assetsError,

    // UI state
    isApplyingTemplate,
    isUploading,

    // Actions
    fetchBranding,
    handleUpdateBranding,
    handleApplyTemplate,
    handleResetToDefault,
    handleUploadAsset,
    handleDeleteAsset,

    // Retry functions
    retryFetchBranding,
    retryFetchTemplates,
    retryFetchAssets,
  };
};