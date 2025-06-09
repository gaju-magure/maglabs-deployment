import { getBaseUrl } from "@/lib/utils";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/accounts/login/`, {
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
