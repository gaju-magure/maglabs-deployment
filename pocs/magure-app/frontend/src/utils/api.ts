function pickAPIBaseUrl() {
  return `http://${window.location.hostname }:8000`
}

const API_BASE_URL = pickAPIBaseUrl();

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface CreateTenantRequest {
  name: string;
  schema_name: string;
  domain: string;
  admin_email: string;
  admin_password: string;
}

interface Tenant {
  id: number;
  name: string;
  schema_name: string;
  created_at: string;
  updated_at: string;
  primary_domain: string;
}

interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface CreateUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  message: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return response.json();
  }

  async getTenants(): Promise<Tenant[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenants');
    }

    return response.json();
  }

  async createTenant(tenantData: CreateTenantRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tenantData),
    });

    if (!response.ok) {
      throw new Error('Failed to create tenant');
    }
  }

  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
export type { LoginRequest, LoginResponse, CreateTenantRequest, Tenant, CreateUserRequest, CreateUserResponse };
