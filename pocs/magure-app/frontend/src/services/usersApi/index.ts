const API_BASE_URL = `http://${window.location.hostname}:8000`;

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface CreateUserResponse {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/accounts/users/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}

export async function getUsers(): Promise<CreateUserResponse []> {
  const response = await fetch(`${API_BASE_URL}/api/v1/accounts/users/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}
