import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { TableAction } from '../BaseTable';
import { TenantData } from '../columns/tenantColumns';

interface TenantActionsConfig {
  onEdit: (tenant: TenantData) => void;
  onDelete: (tenant: TenantData) => void;
}

export const createTenantActions = ({ onEdit, onDelete }: TenantActionsConfig): TableAction<TenantData>[] => [
  {
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost',
    title: 'Edit tenant'
  },
  {
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost',
    className: 'text-red-600 hover:text-red-700',
    title: 'Delete tenant'
  }
];