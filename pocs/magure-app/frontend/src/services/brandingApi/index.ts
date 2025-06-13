import { getBaseUrl } from "@/lib/utils";

const API_BASE_URL = `${getBaseUrl()}/api/tenants`;

// Create authenticated request headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(),
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export interface ThemeTemplate {
  template_id: string;
  template_name: string;
  template_slug: string;
  template_category: string;
  template_description: string;
  target_industries: string[];
  preview_image_url: string;
  popularity_score: number;
  is_active: boolean;
  is_default: boolean;
  theme_configuration: Record<string, any>;
  created_at: string;
}

export interface TenantAsset {
  asset_id: string;
  asset_type: string;
  asset_category: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  dimensions: Record<string, any>;
  alt_text: string;
  usage_context: string[];
  optimization_variants: Record<string, any>;
  cdn_urls: Record<string, any>;
  created_at: string;
}

export interface TenantBranding {
  branding_id: string;
  template_source: ThemeTemplate | null;
  template_version: string;
  auto_update_from_template: boolean;
  customization_level: string;
  setup_source: string;
  is_onboarding_generated: boolean;
  can_be_customized: boolean;
  primary_colors: Record<string, any>;
  secondary_colors: Record<string, any>;
  accent_colors: Record<string, any>;
  neutral_palette: Record<string, any>;
  font_config: Record<string, any>;
  font_sizes: Record<string, any>;
  spacing_scale: Record<string, any>;
  border_radius: Record<string, any>;
  component_overrides: Record<string, any>;
  custom_css: string;
  version_number: number;
  assets: TenantAsset[];
  created_at: string;
  updated_at: string;
}

export interface BrandingUpdateData {
  template_id?: string;
  auto_update_from_template?: boolean;
  customization_level?: string;
  primary_colors?: Record<string, any>;
  secondary_colors?: Record<string, any>;
  accent_colors?: Record<string, any>;
  neutral_palette?: Record<string, any>;
  font_config?: Record<string, any>;
  font_sizes?: Record<string, any>;
  spacing_scale?: Record<string, any>;
  border_radius?: Record<string, any>;
  component_overrides?: Record<string, any>;
  custom_css?: string;
}

// Branding API functions
export const getBranding = async (): Promise<TenantBranding> => {
  return apiRequest('/branding/');
};

export const updateBranding = async (data: BrandingUpdateData): Promise<TenantBranding> => {
  return apiRequest('/branding/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const applyTemplate = async (templateId: string): Promise<{ message: string; branding: TenantBranding }> => {
  return apiRequest('/branding/apply_template/', {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId }),
  });
};

export const resetToDefault = async (): Promise<{ message: string; branding: TenantBranding }> => {
  return apiRequest('/branding/reset_to_default/', {
    method: 'POST',
  });
};

// Theme Templates API functions
export const getThemeTemplates = async (): Promise<ThemeTemplate[]> => {
  const data = await apiRequest('/templates/');
  return data.results || data;
};

export const getTemplateCategories = async (): Promise<string[]> => {
  const data = await apiRequest('/templates/categories/');
  return data.categories;
};

export const getTemplateIndustries = async (): Promise<string[]> => {
  const data = await apiRequest('/templates/industries/');
  return data.industries;
};

export const getTemplateRecommendations = async (): Promise<{ recommendations: ThemeTemplate[]; based_on: string }> => {
  return apiRequest('/templates/recommendations/');
};

// Assets API functions
export const getAssets = async (): Promise<TenantAsset[]> => {
  const data = await apiRequest('/assets/');
  return data.results || data;
};

export const uploadAsset = async (file: File, assetType: string, assetCategory: string = 'core'): Promise<TenantAsset> => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('file_path', file);
  formData.append('asset_type', assetType);
  formData.append('asset_category', assetCategory);
  formData.append('alt_text', file.name);
  
  const response = await fetch(`${API_BASE_URL}/assets/`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // Note: Don't set Content-Type for FormData, let browser set it
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const deleteAsset = async (assetId: string): Promise<void> => {
  await apiRequest(`/assets/${assetId}/`, {
    method: 'DELETE',
  });
};

// Error handling wrapper
export const handleApiError = (error: any): string => {
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};