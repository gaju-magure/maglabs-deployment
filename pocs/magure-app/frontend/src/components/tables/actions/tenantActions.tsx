import React from 'react';
import { Edit, Trash2, Mail, RefreshCw } from 'lucide-react';
import { TableAction } from '../BaseTable';
import { TenantData } from '../columns/tenantColumns';

interface TenantActionsConfig {
  onEdit: (tenant: TenantData) => void;
  onDelete: (tenant: TenantData) => void;
  onSendInvitation: (tenant: TenantData) => void;
}

export const createTenantActions = ({ onEdit, onDelete, onSendInvitation }: TenantActionsConfig): TableAction<TenantData>[] => {
  const baseActions: TableAction<TenantData>[] = [
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost',
      title: 'Edit tenant'
    },
  ];

  // Add onboarding-specific actions
  const onboardingActions: TableAction<TenantData>[] = [];

  // Show send invitation action for all non-completed tenants
  onboardingActions.push({
    label: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      // More explicit logic: if completed, show "Completed"
      // If pending or any uncertain state, show "Send Invitation"
      // Only show "Resend" if explicitly in_progress
      if (status === 'completed') {
        return 'Completed';
      } else if (status === 'in_progress') {
        return 'Resend Invitation';
      } else {
        // Default to "Send Invitation" for pending and any other states
        return 'Send Invitation';
      }
    },
    icon: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      if (status === 'completed') {
        return <Mail className="h-4 w-4 opacity-50" />;
      } else if (status === 'in_progress') {
        return <RefreshCw className="h-4 w-4" />;
      } else {
        // Default to regular mail icon for pending and other states
        return <Mail className="h-4 w-4" />;
      }
    },
    onClick: onSendInvitation,
    variant: 'ghost',
    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    title: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      if (status === 'completed') {
        return 'Onboarding already completed';
      } else if (status === 'in_progress') {
        return 'Resend onboarding invitation (generates new token)';
      } else {
        // Default for pending and other states
        return 'Send onboarding invitation email';
      }
    },
    disabled: (tenant) => (tenant.onboarding_status || 'pending') === 'completed'
  });

  const deleteAction: TableAction<TenantData> = {
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost',
    className: 'text-red-600 hover:text-red-700',
    title: 'Delete tenant (schema and all data will be permanently removed)'
  };

  return [...baseActions, ...onboardingActions, deleteAction];
};