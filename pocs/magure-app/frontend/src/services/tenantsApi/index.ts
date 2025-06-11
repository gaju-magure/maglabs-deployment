import { getBaseUrl } from "@/lib/utils";

export interface CreateTenantRequest {
  name: string;
  domain_prefix: string;
  admin_email: string;
  status: 'active' | 'inactive';
}

export interface Tenant {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  primary_domain: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  admin_email?: string;
  onboarding_progress?: {
    completion_percentage: number;
    completed_steps: number;
    total_steps: number;
    current_step: string;
  } | null;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function getTenants(): Promise<Tenant[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }

  return response.json();
}

export async function createTenant(tenantData: CreateTenantRequest): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tenantData),
  });

  if (!response.ok) {
    throw new Error('Failed to create tenant');
  }
}

export interface UpdateTenantRequest {
  name?: string;
  domain_prefix?: string;
}

export async function updateTenant(id: number, tenantData: UpdateTenantRequest): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(tenantData),
  });

  if (!response.ok) {
    throw new Error('Failed to update tenant');
  }
}

export async function deleteTenant(id: number): Promise<{ message: string }> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete tenant');
  }

  return response.json();
}

export async function sendOnboardingInvitation(id: number): Promise<{ 
  message: string; 
  email_sent: boolean; 
  is_resend?: boolean;
  admin_email?: string;
  token?: string; 
}> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/${id}/send_invitation/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to send onboarding invitation');
  }

  return response.json();
}

