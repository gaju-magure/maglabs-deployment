const API_BASE_URL = `http://${window.location.hostname}:8000`;

export interface CreateTenantRequest {
  name: string;
  schema_name: string;
  domain: string;
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
  const response = await fetch(`${API_BASE_URL}/api/v1/tenants/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }

  return response.json();
}

export async function createTenant(tenantData: CreateTenantRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/tenants/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tenantData),
  });

  if (!response.ok) {
    throw new Error('Failed to create tenant');
  }
}
