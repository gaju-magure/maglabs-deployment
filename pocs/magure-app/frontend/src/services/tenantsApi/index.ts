import { getBaseUrl } from "@/lib/utils";

export interface CreateTenantRequest {
  name: string;
  schema_name: string;
  domain_prefix: string;
  admin_email: string;
  admin_password: string;
}

export interface Tenant {
  id: number;
  name: string;
  schema_name: string;
  created_at: string;
  updated_at: string;
  primary_domain: string;
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

export async function deleteTenant(id: number): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete tenant');
  }
}
