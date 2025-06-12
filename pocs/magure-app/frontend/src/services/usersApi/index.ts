import { getBaseUrl } from "@/lib/utils";

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  job_title?: string;
  phone_number?: string;
  department_id?: number;
  custom_role_id?: number;
}

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  profile?: {
    job_title?: string;
    department?: {
      id: number;
      name: string;
    } | null;
    custom_role?: {
      id: number;
      name: string;
    } | null;
  };
  avatar_url?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  job_title?: string;
  department_id?: number;
  custom_role_id?: number;
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
    throw new Error('Failed to get users');
  }

  return response.json();
}

export async function updateUser(userId: string, userData: UpdateUserRequest): Promise<CreateUserResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/users/${userId}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  return response.json();
}

export async function getCurrentUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/users/${userId}/profile/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  return response.json();
}

export async function updateCurrentUserProfile(userId: string, profileData: UpdateProfileRequest): Promise<UserProfile> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/users/${userId}/profile/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}
