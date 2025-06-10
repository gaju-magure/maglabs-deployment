import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { DataTableColumn } from '@/components/ui/data-table';

export interface UserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

const getRoleBadgeColor = (userRole: string) => {
  switch (userRole) {
    case 'superadmin': return 'bg-gradient-to-r from-[#FDA052] to-[#B96AF7] text-white border-0';
    case 'tenant_admin': return 'bg-gradient-to-r from-[#B96AF7] to-[#3077F3] text-white border-0';
    case 'tenant_user': return 'bg-gradient-to-r from-[#3077F3] to-[#41E6F8] text-white border-0';
    default: return 'bg-gray-200 text-gray-700';
  }
};

export const userColumns: DataTableColumn<UserData>[] = [
  {
    key: 'user',
    label: 'User',
    render: (user) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FDA052] to-[#B96AF7] flex items-center justify-center text-white font-semibold text-sm">
          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {user.first_name} {user.last_name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            @{user.username}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'email',
    label: 'Email',
    render: (user) => (
      <span className="text-gray-700 dark:text-gray-300" style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {user.email}
      </span>
    )
  },
  {
    key: 'role',
    label: 'Role',
    render: (user) => (
      <Badge className={`${getRoleBadgeColor(user.role)} px-3 py-1`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  },
  {
    key: 'status',
    label: 'Status',
    className: 'text-center',
    render: (user) => (
      user.is_active ? (
        <div className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Active</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 text-gray-400">
          <XCircle className="w-4 h-4" />
          <span className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>Inactive</span>
        </div>
      )
    )
  },
];