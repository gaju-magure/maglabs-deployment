import { getBaseUrl } from "@/lib/utils";

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

export interface UserListPaginationResponse {
  count: number,
  next: string,
  previous: null,
  results: CreateUserResponse []
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/users/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}

export async function getUsers(): Promise<UserListPaginationResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/users/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
}
