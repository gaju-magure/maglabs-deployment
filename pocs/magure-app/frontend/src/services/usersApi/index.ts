const API_BASE_URL = `http://${window.location.hostname}:8000`;

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface CreateUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  message: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}
