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
      switch (status) {
        case 'pending':
          return 'Send Invitation';
        case 'in_progress':
          return 'Resend Invitation';
        case 'completed':
          return 'Completed';
        default:
          return 'Send Invitation';
      }
    },
    icon: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      switch (status) {
        case 'in_progress':
          return <RefreshCw className="h-4 w-4" />;
        case 'completed':
          return <Mail className="h-4 w-4 opacity-50" />;
        default:
          return <Mail className="h-4 w-4" />;
      }
    },
    onClick: onSendInvitation,
    variant: 'ghost',
    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    title: (tenant) => {
      const status = tenant.onboarding_status || 'pending';
      switch (status) {
        case 'completed':
          return 'Onboarding already completed';
        case 'in_progress':
          return 'Resend onboarding invitation (generates new token)';
        case 'pending':
          return 'Send onboarding invitation email';
        default:
          return 'Send onboarding invitation';
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