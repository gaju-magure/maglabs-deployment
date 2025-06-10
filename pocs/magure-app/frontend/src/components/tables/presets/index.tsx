import React from 'react';
import { Building, Users, UserPlus } from 'lucide-react';
import { tenantColumns, userColumns, createTenantActions, createUserActions, TenantData, UserData } from '../index';

// Preset configurations for common table types
export interface TablePresetConfig<T> {
  title: string;
  description: string;
  searchPlaceholder: string;
  createButtonLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateIcon: React.ReactNode;
  columns: any[];
  createActions: (handlers: any) => any[];
}

export const tenantTablePreset: TablePresetConfig<TenantData> = {
  title: 'Tenants',
  description: 'Manage tenants and their configurations',
  searchPlaceholder: 'Search tenants by name, schema, or domain...',
  createButtonLabel: 'Create Tenant',
  emptyStateTitle: 'No tenants found',
  emptyStateDescription: 'Get started by creating your first tenant to manage organizations.',
  emptyStateIcon: <Building className="w-8 h-8 text-gray-400" />,
  columns: tenantColumns,
  createActions: ({ onEdit, onDelete, onSendInvitation }) => createTenantActions({ onEdit, onDelete, onSendInvitation }),
};

export const userTablePreset: TablePresetConfig<UserData> = {
  title: 'User Management',
  description: 'Manage users and their permissions',
  searchPlaceholder: 'Search users by name, email, or username...',
  createButtonLabel: 'Create User',
  emptyStateTitle: 'No users found',
  emptyStateDescription: 'Get started by creating your first user',
  emptyStateIcon: <UserPlus className="w-8 h-8 text-gray-400" />,
  columns: userColumns,
  createActions: ({ onEdit, onDelete, canEdit, canDelete }) => 
    createUserActions({ onEdit, onDelete, canEdit, canDelete }),
};

// Preset variants for different contexts
export const tenantManagementPreset = {
  ...tenantTablePreset,
  title: 'Tenant Management',
};

export const superAdminUserPreset = {
  ...userTablePreset,
  title: 'Superadmin User Management',
};

export const tenantAdminUserPreset = {
  ...userTablePreset,
  title: 'Tenant User Management',
};