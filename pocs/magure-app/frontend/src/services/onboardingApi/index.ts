import { getBaseUrl } from "@/lib/utils";

export interface OnboardingTenant {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  primary_domain: string;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  admin_email: string;
  onboarding_progress: {
    completion_percentage: number;
    completed_steps: number;
    total_steps: number;
    current_step: string;
  } | null;
}

export interface OnboardingStatus {
  tenant_name: string;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  completion_percentage: number;
  completed_steps: number;
  total_steps: number;
  steps: {
    email_sent: boolean;
    profile_setup: boolean;
    company_details: boolean;
    preferences: boolean;
  };
}

export interface ProfileSetupData {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface CompanyDetailsData {
  token: string;
  company_name: string;
  company_size: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  industry: string;
  company_website?: string;
  description?: string;
}

export interface PreferencesData {
  token: string;
  timezone: string;
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function sendOnboardingInvitation(tenantId: number): Promise<{ message: string; email_sent: boolean; token?: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/${tenantId}/send_invitation/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to send onboarding invitation');
  }

  return response.json();
}

export async function verifyOnboardingToken(token: string): Promise<{ tenant: OnboardingTenant; valid: boolean }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/onboarding/verify-token/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify onboarding token');
  }

  return response.json();
}

export async function getOnboardingStatus(token: string): Promise<OnboardingStatus> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/onboarding/status/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Failed to get onboarding status');
  }

  return response.json();
}

export async function completeProfileSetup(data: ProfileSetupData): Promise<{ message: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/onboarding/profile-setup/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to complete profile setup');
  }

  return response.json();
}

export async function completeCompanyDetails(data: CompanyDetailsData): Promise<{ message: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/onboarding/company-details/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to complete company details');
  }

  return response.json();
}

export async function completePreferences(data: PreferencesData): Promise<{ message: string; onboarding_completed: boolean }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/onboarding/preferences/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to complete preferences');
  }

  return response.json();
}