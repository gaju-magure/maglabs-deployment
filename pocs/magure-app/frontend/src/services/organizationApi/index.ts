import { getBaseUrl } from "@/lib/utils";

// Interfaces for custom roles
export interface CustomRole {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, unknown>;
  parent_role?: number;
  is_active: boolean;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export interface CreateCustomRoleRequest {
  name: string;
  description?: string;
  permissions?: Record<string, unknown>;
  parent_role?: number;
  is_active?: boolean;
}

export interface UpdateCustomRoleRequest {
  name?: string;
  description?: string;
  permissions?: Record<string, unknown>;
  parent_role?: number;
  is_active?: boolean;
}

// Interfaces for departments
export interface Department {
  id: number;
  name: string;
  description: string;
  parent_department?: number;
  department_head?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  parent_department?: number;
  department_head?: number;
  is_active?: boolean;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  parent_department?: number;
  department_head?: number;
  is_active?: boolean;
}

// Response types
export interface CustomRolesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomRole[];
}

export interface DepartmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Custom Roles API Functions
export async function getCustomRoles(): Promise<CustomRolesResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/roles/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get custom roles');
  }

  return response.json();
}

export async function createCustomRole(roleData: CreateCustomRoleRequest): Promise<CustomRole> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/roles/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    throw new Error('Failed to create custom role');
  }

  return response.json();
}

export async function updateCustomRole(roleId: number, roleData: UpdateCustomRoleRequest): Promise<CustomRole> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/roles/${roleId}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    throw new Error('Failed to update custom role');
  }

  return response.json();
}

export async function deleteCustomRole(roleId: number): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/roles/${roleId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete custom role');
  }
}

export async function duplicateCustomRole(roleId: number): Promise<CustomRole> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/roles/${roleId}/duplicate/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to duplicate custom role');
  }

  return response.json();
}

// Departments API Functions
export async function getDepartments(): Promise<DepartmentsResponse> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get departments');
  }

  return response.json();
}

export async function createDepartment(deptData: CreateDepartmentRequest): Promise<Department> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(deptData),
  });

  if (!response.ok) {
    throw new Error('Failed to create department');
  }

  return response.json();
}

export async function updateDepartment(deptId: number, deptData: UpdateDepartmentRequest): Promise<Department> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/${deptId}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(deptData),
  });

  if (!response.ok) {
    throw new Error('Failed to update department');
  }

  return response.json();
}

export async function deleteDepartment(deptId: number): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/${deptId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete department');
  }
}

export async function getDepartmentTree(): Promise<Department[]> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/tree/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get department tree');
  }

  return response.json();
}

export async function assignDepartmentHead(deptId: number, userId: number): Promise<Department> {
  const response = await fetch(`${getBaseUrl()}/api/v1/tenants/admin/departments/${deptId}/assign_head/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to assign department head');
  }

  return response.json();
}