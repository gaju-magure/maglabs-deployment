import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { TableAction } from '../BaseTable';
import { UserData } from '../columns/userColumns';

interface UserActionsConfig {
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const createUserActions = ({ 
  onEdit, 
  onDelete, 
  canEdit = false, 
  canDelete = false 
}: UserActionsConfig): TableAction<UserData>[] => {
  const actions: TableAction<UserData>[] = [];

  if (canEdit && onEdit) {
    actions.push({
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost',
      title: 'Edit user'
    });
  }

  if (canDelete && onDelete) {
    actions.push({
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'ghost',
      className: 'text-red-600 hover:text-red-700',
      title: 'Delete user'
    });
  }

  return actions;
};